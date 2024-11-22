
"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  startOfHour, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  eachHourOfInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval
} from 'date-fns';

interface ServiceData {
  name: string;
  group: string;
  uptime: Array<{
    status: number;
    timestamp: Date;
    uptimePercentage: number;
  }>;
  uptimePercentage: number;
}

export function usePrometheusData(timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly') {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Calculate time range and step based on timeframe
        let range: string;
        let step: string;
        
        switch (timeframe) {
          case 'minutes':
            range = '1h';
            step = '60'; // 1 minute intervals
            break;
          case 'hourly':
            range = '24h';
            step = '3600'; // 1 hour intervals
            break;
          case 'weekly':
            range = '7d';
            step = '86400'; // 1 day intervals
            break;
          case 'daily':
            range = '30d';
            step = '86400'; // 1 day intervals
            break;
          case 'monthly':
            range = '12M';
            step = '86400'; // 1 day intervals for monthly view
            break;
        }

        const response = await axios.get('/api/metrics', {
          params: { range, step }
        });

        if (response.data?.status !== 'success') {
          throw new Error('Invalid response from Prometheus');
        }

        const processedData = processPrometheusData(response.data, timeframe);
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
    
    // Adjust refresh interval based on timeframe
    const refreshIntervals: Record<string, number> = {
      minutes: 60000,    // 1 minute
      hourly: 300000,    // 5 minutes
      weekly: 3600000,   // 1 hour
      daily: 3600000,    // 1 hour
      monthly: 3600000,  // 1 hour
    };
    
    const interval = setInterval(fetchData, refreshIntervals[timeframe]);
    return () => clearInterval(interval);
  }, [timeframe]);

  return { services, loading, error };
}

function processPrometheusData(data: any, timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'): ServiceData[] {
  const now = new Date();
  const serviceMap = new Map<string, ServiceData>();

  // Generate time intervals based on timeframe
  let intervals: Date[];
  switch (timeframe) {
    case 'minutes':
      const hourAgo = subHours(now, 1);
      intervals = Array.from({ length: 60 }, (_, i) => new Date(hourAgo.getTime() + i * 60000));
      break;
    case 'hourly':
      intervals = eachHourOfInterval({
        start: subHours(startOfHour(now), 23),
        end: now
      });
      break;
    case 'weekly':
      intervals = eachDayOfInterval({
        start: subDays(startOfDay(now), 6),
        end: now
      });
      break;
    case 'daily':
      intervals = eachDayOfInterval({
        start: subDays(startOfDay(now), 29),
        end: now
      });
      break;
    case 'monthly':
      intervals = eachMonthOfInterval({
        start: subMonths(startOfMonth(now), 11),
        end: now
      });
      break;
  }

  // Initialize services with all intervals
  data.data.result.forEach((metric: any) => {
    const name = metric.metric.service_name;
    const group = metric.metric.group;
    
    if (!serviceMap.has(name)) {
      serviceMap.set(name, {
        name,
        group,
        uptime: intervals.map(timestamp => ({
          timestamp,
          status: -1, // Default to "no data"
          uptimePercentage: 0
        })),
        uptimePercentage: 0
      });
    }

    const service = serviceMap.get(name)!;
    
    // Process metric values
    metric.values.forEach(([timestamp, value]: [number, string]) => {
      const pointDate = new Date(timestamp * 1000);
      const intervalIndex = intervals.findIndex(interval => {
        switch (timeframe) {
          case 'minutes':
            return Math.abs(interval.getTime() - pointDate.getTime()) < 30000; // Within 30 seconds
          case 'hourly':
            return startOfHour(interval).getTime() === startOfHour(pointDate).getTime();
          case 'weekly':
          case 'daily':
            return startOfDay(interval).getTime() === startOfDay(pointDate).getTime();
          case 'monthly':
            return startOfMonth(interval).getTime() === startOfMonth(pointDate).getTime();
        }
      });

      if (intervalIndex !== -1) {
        service.uptime[intervalIndex].status = parseInt(value);
        service.uptime[intervalIndex].uptimePercentage = value === "1" ? 100 : 0;
      }
    });

    // Calculate overall uptime percentage from intervals with data
    const intervalsWithData = service.uptime.filter(point => point.status !== -1);
    service.uptimePercentage = intervalsWithData.length > 0
      ? intervalsWithData.reduce((sum, point) => sum + point.uptimePercentage, 0) / intervalsWithData.length
      : 0;
  });

  return Array.from(serviceMap.values());
}