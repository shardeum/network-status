import { THRESHOLDS, STATUS, MINUTES_IN_DAY } from '@/lib/constants';
import { endOfDay } from 'date-fns';

interface DowntimePeriod {
  start: number;
  end: number;
  duration: number;
}

export function calculateStatus(downtimeMinutes: number): number {
  if (downtimeMinutes === MINUTES_IN_DAY) return STATUS.NO_DATA;
  if (downtimeMinutes >= THRESHOLDS.DOWNTIME) return STATUS.DOWN;
  if (downtimeMinutes > 0) return STATUS.PARTIAL;
  return STATUS.UP;
}

export function calculateDowntimeMinutes(values: [number, string][]): number {
  if (!values || values.length === 0) return MINUTES_IN_DAY;

  let totalDowntimeMinutes = 0;
  const sortedValues = [...values].sort((a, b) => a[0] - b[0]);
  
  for (let i = 0; i < sortedValues.length - 1; i++) {
    const [currentTimestamp, currentValue] = sortedValues[i];
    const [nextTimestamp, _] = sortedValues[i + 1];
    const currentStatus = parseFloat(currentValue);
    
    if (currentStatus < 1) {
      const intervalMinutes = (nextTimestamp - currentTimestamp) / 60;
      totalDowntimeMinutes += intervalMinutes;
    }
  }

  // Handle the last reading within the same day
  const lastReading = sortedValues[sortedValues.length - 1];
  if (lastReading) {
    const [lastTimestamp, lastValue] = lastReading;
    const currentStatus = parseFloat(lastValue);
    
    if (currentStatus < 1) {
      const now = Date.now() / 1000;
      const dayEnd = endOfDay(new Date(lastTimestamp * 1000)).getTime() / 1000;
      const endTime = Math.min(now, dayEnd);
      const minutesSinceLastReading = (endTime - lastTimestamp) / 60;
      totalDowntimeMinutes += minutesSinceLastReading;
    }
  }

  return Math.min(Math.round(totalDowntimeMinutes), MINUTES_IN_DAY);
}

export function formatUptime(uptimeMinutes: number): string {
  if (uptimeMinutes === MINUTES_IN_DAY) return '24h 0m';
  const hours = Math.floor(uptimeMinutes / 60);
  const minutes = Math.round(uptimeMinutes % 60);
  return `${hours}h ${minutes}m`;
}

export function formatDowntime(downtimeMinutes: number): string {
  if (downtimeMinutes === 0) return '0m';
  if (downtimeMinutes === MINUTES_IN_DAY) return '24h 0m';
  
  const hours = Math.floor(downtimeMinutes / 60);
  const minutes = Math.round(downtimeMinutes % 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function calculateUptimePercentage(downtimeMinutes: number): number {
  if (downtimeMinutes === MINUTES_IN_DAY) return 0;
  const uptimeMinutes = MINUTES_IN_DAY - downtimeMinutes;
  return (uptimeMinutes / MINUTES_IN_DAY) * 100;
}