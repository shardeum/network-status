export const THRESHOLDS = {
    // Thresholds in minutes
    PARTIAL_OUTAGE: 9,    // <9 minutes downtime = partial outage
    DOWNTIME: 9,         // ≥9 minutes downtime = down
  } as const;
  
  export const STATUS = {
    NO_DATA: -1,
    DOWN: 0,      // ≥9 minutes downtime
    UP: 1,        // 0 minutes downtime
    PARTIAL: 2,   // <9 minutes downtime
  } as const;
  
  export const STATUS_COLORS = {
    [STATUS.NO_DATA]: 'bg-muted', 
    [STATUS.DOWN]: 'bg-red-500',
    [STATUS.UP]: 'bg-green-500',
    [STATUS.PARTIAL]: 'bg-orange-500',
  } as const;
  
  export const STATUS_LABELS = {
    [STATUS.NO_DATA]: 'No Data',
    [STATUS.DOWN]: 'Offline',
    [STATUS.UP]: 'Online',
    [STATUS.PARTIAL]: 'Partial Outage',
  } as const;
  
  export const MINUTES_IN_DAY = 1440; // 24 hours * 60 minutes
  
  export const REFRESH_INTERVALS = {
    METRICS: 60000,    // 1 minute
    STATUS: 60000,     // 1 minute
  } as const;
  
  export const API_ENDPOINTS = {
    METRICS: '/api/metrics',
    STATUS: '/api/status',
    LATENCY: '/api/latency',
  } as const;
  
  export const PROMETHEUS_STEP = 300; // 5-minute intervals for more accurate data
