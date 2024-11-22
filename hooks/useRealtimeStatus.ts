"use client"

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface ServiceStatus {
  name: string;
  group: string;
  status: number;
  latency?: number;
}

export function useRealtimeStatus(refreshInterval = 10000) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('/api/status');
      setServices(prevServices => {
        // Smooth transition: only update changed values
        const newServices = response.data.map((newService: ServiceStatus) => {
          const prevService = prevServices.find(s => s.name === newService.name);
          if (!prevService) return newService;

          // Only update if values have changed
          return {
            ...prevService,
            status: newService.status,
            latency: newService.latency
          };
        });

        return newServices;
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch status'));
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    loadInitialData();
  }, [fetchData]);

  // Set up refresh interval
  useEffect(() => {
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { 
    services, 
    loading, 
    error,
    lastUpdated,
    refresh: fetchData
  };
}