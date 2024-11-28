import { ServiceData } from '@/types/service';
import { STATUS, MINUTES_IN_DAY } from '@/lib/constants';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { calculateStatus, calculateDowntimeMinutes, calculateUptimePercentage } from './uptime';

export function processPrometheusData(data: any): ServiceData[] {
  if (!data?.result) return [];

  const serviceMap = new Map<string, ServiceData>();
  const now = new Date();

  // Initialize services with empty data
  data.result.forEach((metric: any) => {
    const name = metric.metric.service_name;
    const group = metric.metric.group;
    
    if (!serviceMap.has(name)) {
      const emptyDays = Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(now, 29 - i));
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
  });

  // Process metrics for each service
  data.result.forEach((metric: any) => {
    const name = metric.metric.service_name;
    const service = serviceMap.get(name);
    if (!service) return;

    // Process each day's data independently
    service.uptime = service.uptime.map(day => {
      const dayStart = startOfDay(day.timestamp);
      const dayEnd = endOfDay(day.timestamp);
      
      // Filter values for this specific day
      const dayValues = metric.values.filter((value: [number, string]) => {
        const timestamp = value[0] * 1000;
        return timestamp >= dayStart.getTime() && timestamp <= dayEnd.getTime();
      });

      if (dayValues.length === 0) {
        return day;
      }

      const downtimeMinutes = calculateDowntimeMinutes(dayValues);
      return {
        timestamp: dayStart,
        status: calculateStatus(downtimeMinutes),
        uptimePercentage: calculateUptimePercentage(downtimeMinutes),
        downtimeMinutes
      };
    });
  });

  // Calculate overall uptime percentage
  const services: ServiceData[] = [];
  serviceMap.forEach(service => {
    const daysWithData = service.uptime.filter(day => day.status !== STATUS.NO_DATA);
    const uptimePercentage = daysWithData.length > 0
      ? daysWithData.reduce((sum, day) => sum + day.uptimePercentage, 0) / daysWithData.length
      : 0;
    
    services.push({
      ...service,
      uptimePercentage
    });
  });

  return services;
}