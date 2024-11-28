
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


"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS, REFRESH_INTERVALS } from '@/lib/constants';
// import type { ServiceData } from '@/types/service';
import { processPrometheusData } from '@/lib/prometheus';

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