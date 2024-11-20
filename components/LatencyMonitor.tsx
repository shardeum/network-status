"use client"

import { Card } from '@/components/ui/card'
import { useLatencyData } from '@/hooks/useLatencyData'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export function LatencyMonitor() {
  const { services, loading, error } = useLatencyData();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    console.error(error);
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load latency data: {error.message}
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

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'HH:mm');
  };

  const formatLatency = (value: number) => {
    return `${value.toFixed(0)}ms`;
  };

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-600">Response Time (Last Hour)</h2>
      </div>

      {Object.entries(groupedServices).map(([group, groupServices]) => (
        <div key={group} className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">{group}</h2>
          <div className="space-y-4">
            {groupServices.map((service, serviceIndex) => (
              <Card key={service.name} className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">{service.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Average latency: {service.averageLatency.toFixed(0)}ms
                  </p>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={service.dataPoints}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatDate}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={formatLatency}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        labelFormatter={(label) => formatDate(label as number)}
                        formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Latency']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="latency"
                        name="Response Time"
                        stroke={colors[serviceIndex % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}