"use client"

import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format, subMinutes, subHours, subDays, subWeeks, subMonths, isWithinInterval, startOfMinute, endOfMinute, startOfHour, endOfHour, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { usePrometheusData } from '@/hooks/usePrometheusData'
import { Loader2 } from 'lucide-react'

interface UptimeMonitorProps {
  timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'
}

interface TimePoint {
  timestamp: Date;
  status: number | null;
}

export function UptimeMonitor({ timeframe }: UptimeMonitorProps) {
  const { services, loading, error } = usePrometheusData(timeframe);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load service status data: {error.message}
      </div>
    );
  }

  const getTimePoints = (serviceData: any): TimePoint[] => {
    // Find the most recent timestamp in the data
    const latestDataPoint = Math.max(...serviceData.dataPoints.map((p: any) => p.timestamp));
    const latestDate = new Date(latestDataPoint * 1000);
    
    const points: TimePoint[] = [];
    let totalPoints: number;
    let subtractFn: (date: Date, amount: number) => Date;
    let getInterval: (date: Date) => { start: Date; end: Date };

    switch (timeframe) {
      case 'minutes':
        totalPoints = 60;
        subtractFn = subMinutes;
        getInterval = (date) => ({
          start: startOfMinute(date),
          end: endOfMinute(date)
        });
        break;
      case 'hourly':
        totalPoints = 24;
        subtractFn = subHours;
        getInterval = (date) => ({
          start: startOfHour(date),
          end: endOfHour(date)
        });
        break;
      case 'weekly':
        totalPoints = 7;
        subtractFn = subWeeks;
        getInterval = (date) => ({
          start: startOfWeek(date),
          end: endOfWeek(date)
        });
        break;
      case 'daily':
        totalPoints = 30;
        subtractFn = subDays;
        getInterval = (date) => ({
          start: startOfDay(date),
          end: endOfDay(date)
        });
        break;
      case 'monthly':
        totalPoints = 12;
        subtractFn = subMonths;
        getInterval = (date) => ({
          start: startOfMonth(date),
          end: endOfMonth(date)
        });
        break;
      default:
        totalPoints = 24;
        subtractFn = subHours;
        getInterval = (date) => ({
          start: startOfHour(date),
          end: endOfHour(date)
        });
    }

    // Create array of time points starting from the latest data point
    for (let i = totalPoints - 1; i >= 0; i--) {
      const pointDate = subtractFn(latestDate, i);
      const interval = getInterval(pointDate);
      
      // Find data points within this interval
      const intervalPoints = serviceData.dataPoints.filter((point: any) => {
        const pointDate = new Date(point.timestamp * 1000);
        return isWithinInterval(pointDate, interval);
      });

      // If we have points in this interval, calculate the status
      let status = null;
      if (intervalPoints.length > 0) {
        const upPoints = intervalPoints.filter((point: any) => point.value === "1").length;
        status = upPoints / intervalPoints.length >= 0.9 ? 1 : 0;
      }

      points.push({
        timestamp: pointDate,
        status
      });
    }

    return points;
  };

  const formatTooltipDate = (date: Date) => {
    switch (timeframe) {
      case 'minutes':
        return format(date, 'h:mm a')
      case 'hourly':
        return format(date, 'MMM d, h:00 a')
      case 'weekly':
        return `Week of ${format(date, 'MMM d, yyyy')}`
      case 'daily':
        return format(date, 'MMM d, yyyy')
      case 'monthly':
        return format(date, 'MMMM yyyy')
    }
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'minutes':
        return 'Last Hour'
      case 'hourly':
        return 'Last 24 Hours'
      case 'weekly':
        return 'Last 7 Weeks'
      case 'daily':
        return 'Last 30 Days'
      case 'monthly':
        return 'Last 12 Months'
    }
  };

  // Group services by their group
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.group]) {
      acc[service.group] = [];
    }
    acc[service.group].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-gray-600">{getTimeframeLabel()}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>No Data</span>
            </div>
          </div>
        </div>

        {Object.entries(groupedServices).map(([group, groupServices]) => (
          <div key={group} className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">{group}</h2>
            <div className="space-y-4">
              {groupServices.map((service) => {
                const timePoints = getTimePoints(service);
                
                return (
                  <Card key={service.name} className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{service.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(4px,1fr))] gap-1 h-12">
                      {timePoints.map((point, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-full w-full rounded cursor-pointer transition-colors ${
                                point.status === null
                                  ? 'bg-gray-300'
                                  : point.status === 1
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {formatTooltipDate(point.timestamp)}
                              <br />
                              Status: {point.status === null 
                                ? 'No Data' 
                                : point.status === 1 
                                ? 'Online' 
                                : 'Offline'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-between text-sm text-gray-600">
                      <span>
                        {timePoints.length > 0 && 
                          formatTooltipDate(timePoints[0].timestamp)}
                      </span>
                      <span className="font-medium">
                        {service.uptimePercentage.toFixed(2)}% uptime
                      </span>
                      <span>
                        {timePoints.length > 0 && 
                          formatTooltipDate(timePoints[timePoints.length - 1].timestamp)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}