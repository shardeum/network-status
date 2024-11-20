import { startOfHour, startOfDay, startOfMonth, endOfHour, endOfDay, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface PrometheusValue {
  timestamp: number;
  value: string;
}

interface PrometheusMetric {
  metric: {
    name: string;
    job: string;
    instance: string;
    duration: string;
    timestamp: string;
  };
  values: [number, string][];
}

interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: PrometheusMetric[];
  };
}

interface ProcessedService {
  name: string;
  group: string;
  uptime: Array<{
    status: number;
    timestamp: Date;
  }>;
  uptimePercentage: number;
}

const UPTIME_THRESHOLD = 0.9; // 90% threshold for considering a period as "up"

export function processPrometheusData(
  data: PrometheusResponse,
  timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'
): ProcessedService[] {
  const serviceMetrics = new Map<string, PrometheusMetric[]>();
  
  data.data.result.forEach(metric => {
    const serviceName = metric.metric.name;
    if (!serviceMetrics.has(serviceName)) {
      serviceMetrics.set(serviceName, []);
    }
    serviceMetrics.get(serviceName)?.push(metric);
  });

  const now = new Date();
  const services: ProcessedService[] = [];

  serviceMetrics.forEach((metrics, serviceName) => {
    const timePoints = getTimePoints(now, timeframe);
    const statusPoints = processServiceMetrics(metrics, timePoints, timeframe);
    
    const uptimePercentage = calculateUptimePercentage(statusPoints);

    services.push({
      name: serviceName,
      group: getServiceGroup(serviceName),
      uptime: statusPoints,
      uptimePercentage
    });
  });

  return services;
}

function getTimePoints(now: Date, timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'): Date[] {
  const points: Date[] = [];
  let current: Date;

  switch (timeframe) {
    case 'minutes':
      current = startOfHour(now);
      for (let i = 59; i >= 0; i--) {
        points.push(new Date(current.getTime() - i * 60 * 1000));
      }
      break;
    case 'hourly':
      current = startOfDay(now);
      for (let i = 23; i >= 0; i--) {
        points.push(new Date(current.getTime() - i * 3600 * 1000));
      }
      break;
    case 'weekly':
      current = startOfWeek(now);
      for (let i = 6; i >= 0; i--) {
        points.push(new Date(current.getTime() - i * 7 * 24 * 3600 * 1000));
      }
      break;
    case 'daily':
      current = startOfMonth(now);
      for (let i = 29; i >= 0; i--) {
        points.push(new Date(current.getTime() - i * 24 * 3600 * 1000));
      }
      break;
    case 'monthly':
      current = startOfMonth(now);
      for (let i = 11; i >= 0; i--) {
        const date = new Date(current);
        date.setMonth(date.getMonth() - i);
        points.push(date);
      }
      break;
  }

  return points;
}

function processServiceMetrics(
  metrics: PrometheusMetric[],
  timePoints: Date[],
  timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'
): Array<{ status: number; timestamp: Date }> {
  return timePoints.map(timestamp => {
    const interval = getTimeInterval(timestamp, timeframe);
    const status = getStatusForInterval(metrics, interval);
    return { status, timestamp };
  });
}

function getTimeInterval(timestamp: Date, timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly') {
  switch (timeframe) {
    case 'minutes':
      return {
        start: timestamp,
        end: new Date(timestamp.getTime() + 60 * 1000)
      };
    case 'hourly':
      return {
        start: startOfHour(timestamp),
        end: endOfHour(timestamp)
      };
    case 'weekly':
      return {
        start: startOfWeek(timestamp),
        end: endOfWeek(timestamp)
      };
    case 'daily':
      return {
        start: startOfDay(timestamp),
        end: endOfDay(timestamp)
      };
    case 'monthly':
      return {
        start: startOfMonth(timestamp),
        end: endOfMonth(timestamp)
      };
  }
}

function getStatusForInterval(
  metrics: PrometheusMetric[],
  interval: { start: Date; end: Date }
): number {
  let totalPoints = 0;
  let upPoints = 0;

  metrics.forEach(metric => {
    metric.values.forEach(([timestamp, value]) => {
      const pointDate = new Date(timestamp * 1000);
      if (isWithinInterval(pointDate, interval)) {
        totalPoints++;
        if (value === "1") {
          upPoints++;
        }
      }
    });
  });

  // If no data points in interval, return null to indicate no data
  if (totalPoints === 0) return 0;
  
  // Calculate uptime percentage for the interval
  const uptimePercentage = upPoints / totalPoints;
  
  // Return 1 if uptime percentage meets or exceeds threshold, 0 otherwise
  return uptimePercentage >= UPTIME_THRESHOLD ? 1 : 0;
}

function calculateUptimePercentage(statusPoints: Array<{ status: number }>): number {
  const totalPoints = statusPoints.length;
  if (totalPoints === 0) return 0;

  const upPoints = statusPoints.filter(point => point.status === 1).length;
  return (upPoints / totalPoints) * 100;
}

function getServiceGroup(serviceName: string): string {
  const serviceGroups: Record<string, string> = {
    'JSON-RPC Server': 'Core Services',
    'Explorer': 'Core Services',
    'Website': 'Core Services',
    'Documentation': 'Core Services',
    'Faucet': 'Core Services',
    'Archiver': 'Archivers Servers',
    'Monitor': 'Monitors Servers'
  };

  return serviceGroups[serviceName] || 'Other Services';
}