import { UptimeMonitor } from "@/components/UptimeMonitor";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Service Status Monitor</h1>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-secondary-foreground">
            Last 30 Days
          </h2>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Partial Outage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted rounded"></div>
              <span>No Data</span>
            </div>
          </div>
        </div>
        <UptimeMonitor />
      </div>
    </main>
  );
}
