
import { startOfHour, startOfDay, startOfMonth, endOfHour, endOfDay, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { PrometheusMetric, PrometheusResponse, ProcessedService } from '@/types/service';
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
    
    // Calculate overall uptime percentage from individual interval percentages
    const totalIntervals = statusPoints.length;
    const uptimePercentage = totalIntervals > 0 
      ? statusPoints.reduce((sum, point) => sum + (point.status === 1 ? point.uptimePercentage : 0), 0) / totalIntervals
      : 0;

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
        points.push(new Date(current.getTime() - i * 24 * 3600 * 1000));
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
): Array<{ status: number; timestamp: Date; uptimePercentage: number }> {
  return timePoints.map(timestamp => {
    const interval = getTimeInterval(timestamp, timeframe);
    const { status, uptimePercentage } = getStatusForInterval(metrics, interval, timeframe);
    return { status, timestamp, uptimePercentage };
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
  interval: { start: Date; end: Date },
  timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'
): { status: number; uptimePercentage: number } {
  let totalPoints = 0;
  let upPoints = 0;
  let subIntervalCount = 0;
  let subIntervalUpCount = 0;

  // For larger timeframes, we need to consider the uptime of smaller intervals
  const subIntervalDuration = timeframe === 'minutes' ? 60000 : // 1 minute
                             timeframe === 'hourly' ? 60000 : // 1 minute
                             timeframe === 'daily' ? 3600000 : // 1 hour
                             timeframe === 'weekly' ? 3600000 : // 1 hour
                             86400000; // 1 day for monthly

  const intervalDuration = interval.end.getTime() - interval.start.getTime();
  const expectedSubIntervals = Math.floor(intervalDuration / subIntervalDuration);

  metrics.forEach(metric => {
    metric.values.forEach(([timestamp, value]) => {
      const pointDate = new Date(timestamp * 1000);
      if (isWithinInterval(pointDate, interval)) {
        totalPoints++;
        if (value === "1") {
          upPoints++;
        }

        // Track which sub-interval this point belongs to
        const subIntervalIndex = Math.floor(
          (pointDate.getTime() - interval.start.getTime()) / subIntervalDuration
        );
        if (!subIntervalCount) {
          subIntervalCount = expectedSubIntervals;
        }
      }
    });
  });

  // If no data points in interval, return -1 to indicate no data
  if (totalPoints === 0) return { status: -1, uptimePercentage: 0 };

  // Calculate uptime percentage for this specific interval
  const uptimePercentage = (upPoints / totalPoints) * 100;

  // For larger timeframes, we need a stricter threshold
  // The entire interval is considered up only if we have enough data points
  // and the uptime percentage meets our threshold
  const hasEnoughData = totalPoints >= (subIntervalCount * 0.5); // At least 50% of expected data points
  const meetsThreshold = uptimePercentage >= UPTIME_THRESHOLD * 100;

  return {
    status: hasEnoughData && meetsThreshold ? 1 : 0,
    uptimePercentage
  };
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