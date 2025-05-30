"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { format } from "date-fns";

const REFRESH_INTERVAL = 10000; // 10 seconds

export default function RealtimePage() {
  const { services, loading, error, lastUpdated } =
    useRealtimeStatus(REFRESH_INTERVAL);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive pt-8">
        Failed to load service status: {error.message}
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
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Current Network Status</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {format(lastUpdated, "HH:mm:ss")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedServices).map(([group, services]) =>
            services.map((service) => (
              <Card
                key={service.name}
                className="p-6 relative transition-all duration-200 ease-in-out bg-card text-card-foreground"
              >
                <div className="absolute top-6 right-6">
                  {service.status === -1 ? (
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  ) : service.status === 1 ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-2">{service.name}</h2>
                <p className="text-secondary-foreground">
                  {service.status === -1
                    ? "Unknown"
                    : service.status === 1
                    ? "Operational"
                    : "Down"}
                </p>

                {service.latency !== undefined && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Response time: {service.latency.toFixed(0)}ms
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
