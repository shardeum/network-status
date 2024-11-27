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

    // Process time windows
    const serviceWindows = newTimeWindows.get(name) || [];
    const currentDay = startOfDay(now);
    
    // Get or create current day's window
    let currentWindow = serviceWindows.find(w => 
      w.start.getTime() === currentDay.getTime()
    );

    if (!currentWindow) {
      currentWindow = {
        start: currentDay,
        end: endOfDay(currentDay),
        values: [],
        accumulatedDowntime: 0
      };
      serviceWindows.push(currentWindow);
    }

    // Add new values and calculate accumulated downtime
    const newValues = metric.values.filter((value: [number, string]) => {
      const timestamp = new Date(value[0] * 1000);
      return isWithinInterval(timestamp, { start: currentWindow!.start, end: currentWindow!.end });
    });

    if (newValues.length > 0) {
      currentWindow.values = [...currentWindow.values, ...newValues]
        .sort((a, b) => a[0] - b[0]);

      // Calculate downtime for this window
      const downtimeMinutes = calculateDowntimeMinutes(currentWindow.values);
      currentWindow.accumulatedDowntime = Math.max(
        currentWindow.accumulatedDowntime,
        downtimeMinutes
      );
    }

    newTimeWindows.set(name, serviceWindows);

    // Update service data
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

    // Calculate overall uptime percentage
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