import { THRESHOLDS, STATUS, MINUTES_IN_DAY } from '@/lib/constants';

export function calculateStatus(downtimeMinutes: number): number {
  if (downtimeMinutes === MINUTES_IN_DAY) return STATUS.NO_DATA;
  if (downtimeMinutes >= THRESHOLDS.DOWNTIME) return STATUS.DOWN;
  if (downtimeMinutes > 0) return STATUS.PARTIAL;
  return STATUS.UP;
}

export function calculateDowntimeMinutes(values: [number, string][]): number {
  if (!values || values.length === 0) return MINUTES_IN_DAY;

  let downtimeMinutes = 0;
  let lastTimestamp = 0;
  
  // Sort values by timestamp to ensure chronological order
  const sortedValues = [...values].sort((a, b) => a[0] - b[0]);
  
  sortedValues.forEach(([timestamp, value], index) => {
    const uptimeValue = parseInt(value);
    
    // Calculate interval duration
    const intervalMinutes = index === 0 ? 1 : (timestamp - lastTimestamp) / 60;
    
    // Add downtime if service was down during this interval
    if (uptimeValue === 0) {
      downtimeMinutes += intervalMinutes;
    }
    
    lastTimestamp = timestamp;
  });

  return Math.min(Math.round(downtimeMinutes), MINUTES_IN_DAY);
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