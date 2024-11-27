"use client"
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

import { useState, useEffect } from 'react';
import axios from 'axios';
import { subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { calculateStatus, calculateDowntimeMinutes, calculateUptimePercentage } from '@/lib/uptime';
import { API_ENDPOINTS, REFRESH_INTERVALS, MINUTES_IN_DAY, STATUS } from '@/lib/constants';


export function usePrometheusData() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(API_ENDPOINTS.METRICS);

        if (response.data?.status !== 'success') {
          throw new Error('Invalid response from Prometheus');
        }

        const processedData = processPrometheusData(response.data.data);
        setServices(processedData);
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

function processPrometheusData(data: any): ServiceData[] {
  if (!data?.result) return [];

  const serviceMap = new Map<string, ServiceData>();
  const now = new Date();

  // Initialize services with 30 days of no data
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

    // Group values by day
    const valuesByDay = new Map<string, [number, string][]>();
    
    metric.values.forEach((value: [number, string]) => {
      const date = startOfDay(new Date(value[0] * 1000));
      const dateKey = date.toISOString();
      
      if (!valuesByDay.has(dateKey)) {
        valuesByDay.set(dateKey, []);
      }
      
      valuesByDay.get(dateKey)!.push(value);
    });

    const service = serviceMap.get(name)!;

    // Calculate status for each day
    valuesByDay.forEach((dayValues, dateKey) => {
      const date = new Date(dateKey);
      const downtimeMinutes = calculateDowntimeMinutes(dayValues);
      const status = calculateStatus(downtimeMinutes);
      const uptimePercentage = calculateUptimePercentage(downtimeMinutes);

      const dayIndex = service.uptime.findIndex(day => 
        startOfDay(day.timestamp).getTime() === date.getTime()
      );

      if (dayIndex !== -1) {
        service.uptime[dayIndex] = {
          timestamp: date,
          status,
          uptimePercentage,
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

  return Array.from(serviceMap.values());
}