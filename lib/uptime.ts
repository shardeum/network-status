
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
  
  let lastTimestamp: number | null = null;
  let lastValue: number | null = null;

  for (let i = 0; i < sortedValues.length; i++) {
    const [timestamp, value] = sortedValues[i];
    const currentValue = parseFloat(value);
    
    if (lastTimestamp !== null && lastValue !== null) {
      const timeDiff = (timestamp - lastTimestamp) / 60; // Convert to minutes
      
      // If service was down in the previous reading
      if (lastValue < 1) {
        totalDowntimeMinutes += timeDiff;
      }
    }

    lastTimestamp = timestamp;
    lastValue = currentValue;
  }

  // If the last reading shows service is down, add time until end of day
  if (lastValue !== null && lastValue < 1 && lastTimestamp !== null) {
    const dayEnd = Math.floor(endOfDay(new Date(lastTimestamp * 1000)).getTime() / 1000);
    const finalTimeDiff = Math.min(
      (dayEnd - lastTimestamp) / 60,
      MINUTES_IN_DAY - totalDowntimeMinutes
    );
    totalDowntimeMinutes += finalTimeDiff;
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