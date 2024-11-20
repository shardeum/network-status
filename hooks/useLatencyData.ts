"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';

interface ServiceData {
  name: string;
  group: string;
  dataPoints: Array<{
    timestamp: number;
    latency: number;
  }>;
  averageLatency: number;
}

export function useLatencyData() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/latency', {
          params: {
            range: '1h',
            step: '15' // 15-second intervals for smoother graphs
          }
        });

        if (response.data?.status !== 'success') {
          throw new Error('Invalid response from Prometheus');
        }

        const processedData = processLatencyData(response.data);
        setServices(processedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching latency data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  return { services, loading, error };
}

function processLatencyData(data: any): ServiceData[] {
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
        averageLatency: 0
      });
    }

    const service = serviceMap.get(name)!;
    
    // Add data points
    metric.values.forEach((value: [number, string]) => {
      const [timestamp, latency] = value;
      service.dataPoints.push({
        timestamp,
        latency: parseFloat(latency)
      });
    });
  });

  // Process each service
  return Array.from(serviceMap.values()).map(service => {
    // Sort data points by timestamp
    service.dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate average latency
    const totalLatency = service.dataPoints.reduce((sum, point) => sum + point.latency, 0);
    service.averageLatency = totalLatency / service.dataPoints.length;

    return service;
  });
}