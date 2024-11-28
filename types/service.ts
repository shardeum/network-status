export interface ServiceData {
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
  
  export interface TimeframeStatus {
    timestamp: Date;
    status: number;
    uptimePercentage: number;
    downtimeMinutes: number;
    downtimePeriods: DowntimePeriod[];
  }
  
  export interface DowntimePeriod {
    start: number;
    end: number;
    duration: number;
  }
  
  export interface ServiceGroup {
    [key: string]: ServiceData[];
  }

  export interface TimeframePeriod {
    timestamp: Date;
    status: number;
    uptimePercentage: number;
    downtimeMinutes: number;
    isFinalized: boolean;
  }

  export interface PrometheusMetric {
    metric: {
      name: string;
      job: string;
      instance: string;
      duration: string;
      timestamp: string;
    };
    values: [number, string][];
  }
  
  export interface PrometheusResponse {
    status: string;
    data: {
      resultType: string;
      result: PrometheusMetric[];
    };
  }
  
  export interface ProcessedService {
    name: string;
    group: string;
    uptime: Array<{
      status: number;
      timestamp: Date;
      uptimePercentage: number;
    }>;
    uptimePercentage: number;
  }