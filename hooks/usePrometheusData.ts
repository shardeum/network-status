"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { calculateStatus, calculateDowntimeMinutes, calculateUptimePercentage } from '@/lib/uptime';
import { API_ENDPOINTS, REFRESH_INTERVALS, MINUTES_IN_DAY, STATUS } from '@/lib/constants';

interface ServiceData {
  name: string;
  group: string;
  uptime: Array<{
    status: number;
    timestamp: Date;
    uptimePercentage: number;
    downtimeMinutes: number;
  }>;
  uptimePercentage: number;
}
interface TimeWindow {
  start: Date;
  end: Date;
  values: [number, string][];
  accumulatedDowntime: number;
}

export function usePrometheusData() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeWindows, setTimeWindows] = useState<Map<string, TimeWindow[]>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(API_ENDPOINTS.METRICS);

        if (response.data?.status !== 'success') {
          throw new Error('Invalid response from Prometheus');
        }

        const processedData = processPrometheusData(response.data.data, timeWindows);
        setServices(processedData.services);
        setTimeWindows(processedData.timeWindows);
        setError(null);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVALS.METRICS);
    return () => clearInterval(interval);
  }, []);

  return { services, loading, error };
}

function processPrometheusData(data: any, existingTimeWindows: Map<string, TimeWindow[]>): { 
  services: ServiceData[],
  timeWindows: Map<string, TimeWindow[]>
} {
  if (!data?.result) return { services: [], timeWindows: new Map() };

  const serviceMap = new Map<string, ServiceData>();
  const newTimeWindows = new Map(existingTimeWindows);
  const now = new Date();

  data.result.forEach((metric: any) => {
    const name = metric.metric.service_name;
    const group = metric.metric.group;
    
    if (!serviceMap.has(name)) {
      const emptyDays = Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000));
        return {
          timestamp: date,
          status: STATUS.NO_DATA,
          uptimePercentage: 0,
          downtimeMinutes: MINUTES_IN_DAY
        };
      });

      serviceMap.set(name, {
        name,
        group,
        uptime: emptyDays,
        uptimePercentage: 0
      });
    }

    let serviceWindows = newTimeWindows.get(name) || [];
    
    metric.values.forEach((value: [number, string]) => {
      const timestamp = new Date(value[0] * 1000);
      const dayStart = startOfDay(timestamp);
      
      let window = serviceWindows.find(w => 
        w.start.getTime() === dayStart.getTime()
      );

      if (!window) {
        window = {
          start: dayStart,
          end: endOfDay(dayStart),
          values: [],
          accumulatedDowntime: 0
        };
        serviceWindows.push(window);
      }

      if (isWithinInterval(timestamp, { start: window.start, end: window.end })) {
        const isDown = parseFloat(value[1]) < 1;
        window.values.push([value[0], isDown ? "0" : "1"]);
      }
    });

    serviceWindows = serviceWindows
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(-30);

    serviceWindows.forEach(window => {
      window.values.sort((a, b) => a[0] - b[0]);
      window.accumulatedDowntime = calculateDowntimeMinutes(window.values);
    });

    newTimeWindows.set(name, serviceWindows);

    const service = serviceMap.get(name)!;
    serviceWindows.forEach(window => {
      const dayIndex = service.uptime.findIndex(day => 
        startOfDay(day.timestamp).getTime() === window.start.getTime()
      );

      if (dayIndex !== -1) {
        const downtimeMinutes = window.accumulatedDowntime;
        service.uptime[dayIndex] = {
          timestamp: window.start,
          status: calculateStatus(downtimeMinutes),
          uptimePercentage: calculateUptimePercentage(downtimeMinutes),
          downtimeMinutes
        };
      }
    });

    const daysWithData = service.uptime.filter(day => day.status !== STATUS.NO_DATA);
    service.uptimePercentage = daysWithData.length > 0
      ? daysWithData.reduce((sum, day) => sum + day.uptimePercentage, 0) / daysWithData.length
      : 0;
  });

  return { 
    services: Array.from(serviceMap.values()),
    timeWindows: newTimeWindows
  };
}