"use client"

import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { usePrometheusData } from '@/hooks/usePrometheusData';
import { Loader2 } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS, MINUTES_IN_DAY } from '@/lib/constants';
import { formatUptime, formatDowntime } from '@/lib/uptime';

export function UptimeMonitor() {
  const { services, loading, error } = usePrometheusData();

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
                              STATUS_COLORS[point.status as keyof typeof STATUS_COLORS]
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {format(point.timestamp, 'MMM d, yyyy')}
                            <br />
                            Status: {STATUS_LABELS[point.status as keyof typeof STATUS_LABELS]}
                            <br />
                            Uptime: {formatUptime(MINUTES_IN_DAY - point.downtimeMinutes)}
                            <br />
                            Downtime: {formatDowntime(point.downtimeMinutes)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between text-sm text-gray-600">
                    <span>
                      {service.uptime.length > 0 && 
                        format(service.uptime[0].timestamp, 'MMM d, yyyy')}
                    </span>
                    <span className="font-medium">
                      {service.uptimePercentage.toFixed(2)}% uptime
                    </span>
                    <span>
                      {service.uptime.length > 0 && 
                        format(service.uptime[service.uptime.length - 1].timestamp, 'MMM d, yyyy')}
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