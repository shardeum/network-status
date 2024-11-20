"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';

interface ServiceData {
  name: string;
  group: string;
  dataPoints: Array<{
    timestamp: number;
    value: string;
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
        let maxDataPoints: number;

        switch (timeframe) {
          case 'minutes':
            range = '1h';
            step = '60'; // 1 minute intervals
            maxDataPoints = 60;
            break;
          case 'hourly':
            range = '24h';
            step = '3600'; // 1 hour intervals
            maxDataPoints = 24;
            break;
          case 'weekly':
            range = '7w';
            step = '604800'; // 1 week intervals
            maxDataPoints = 7;
            break;
          case 'daily':
            range = '30d';
            step = '86400'; // 1 day intervals
            maxDataPoints = 30;
            break;
          case 'monthly':
            range = '12M';
            step = '2592000'; // 1 month intervals
            maxDataPoints = 12;
            break;
        }

        const response = await axios.get('/api/metrics', {
          params: { range, step }
        });

        if (response.data?.status !== 'success') {
          throw new Error('Invalid response from Prometheus');
        }

        const processedData = processPrometheusData(response.data, maxDataPoints);
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

function processPrometheusData(data: any, maxDataPoints: number): ServiceData[] {
  if (!data?.data?.result) return [];

  const serviceMap = new Map<string, ServiceData>();

  data.data.result.forEach((metric: any) => {
    const name = metric.metric.service_name;
    const group = metric.metric.group;
    
    if (!serviceMap.has(name)) {
      serviceMap.set(name, {
        name,
        group,
        dataPoints: [],
        uptimePercentage: 0
      });
    }

    const service = serviceMap.get(name)!;
    
    // Add data points and ensure we don't exceed maxDataPoints
    metric.values.forEach((value: [number, string]) => {
      const [timestamp, status] = value;
      service.dataPoints.push({
        timestamp,
        value: status
      });
    });
  });

  // Process each service
  return Array.from(serviceMap.values()).map(service => {
    // Sort data points by timestamp
    service.dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    
    // Limit to maxDataPoints most recent points
    if (service.dataPoints.length > maxDataPoints) {
      service.dataPoints = service.dataPoints.slice(-maxDataPoints);
    }
    
    // Calculate uptime percentage
    const totalPoints = service.dataPoints.length;
    const upPoints = service.dataPoints.filter(point => point.value === "1").length;
    service.uptimePercentage = totalPoints > 0 ? (upPoints / totalPoints) * 100 : 0;

    return service;
  });
}