
"use client"

import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from 'date-fns'
import { usePrometheusData } from '@/hooks/usePrometheusData'
import { Loader2 } from 'lucide-react'

interface UptimeMonitorProps {
  timeframe: 'minutes' | 'hourly' | 'weekly' | 'daily' | 'monthly'
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

  const formatTooltipDate = (date: Date) => {
    switch (timeframe) {
      case 'minutes':
        return format(date, 'h:mm a')
      case 'hourly':
        return format(date, 'MMM d, h:00 a')
      case 'weekly':
        return format(date, 'MMM d, yyyy')
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
        return 'Last 7 Days'
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
              {groupServices.map((service) => (
                <Card key={service.name} className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(4px,1fr))] gap-1 h-12">
                    {service.uptime.map((point, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-full w-full rounded cursor-pointer transition-colors ${
                              point.status === -1
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
                            Status: {point.status === -1 
                              ? 'No Data' 
                              : point.status === 1 
                              ? 'Online' 
                              : 'Offline'}
                            <br />
                            Uptime: {point.uptimePercentage.toFixed(2)}%
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between text-sm text-gray-600">
                    <span>
                      {service.uptime.length > 0 && 
                        formatTooltipDate(service.uptime[0].timestamp)}
                    </span>
                    <span className="font-medium">
                      {service.uptimePercentage.toFixed(2)}% uptime
                    </span>
                    <span>
                      {service.uptime.length > 0 && 
                        formatTooltipDate(service.uptime[service.uptime.length - 1].timestamp)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}