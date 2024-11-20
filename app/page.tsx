import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UptimeMonitor } from "@/components/UptimeMonitor"
import { LatencyMonitor } from '@/components/LatencyMonitor'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shardeum Network Status Monitor</h1>
        
        <Tabs defaultValue="minutes" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="minutes">Minutes</TabsTrigger>
            <TabsTrigger value="hourly">Hourly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="latency">Latency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="minutes">
            <UptimeMonitor timeframe="minutes" />
          </TabsContent>

          <TabsContent value="hourly">
            <UptimeMonitor timeframe="hourly" />
          </TabsContent>
          
          <TabsContent value="weekly">
            <UptimeMonitor timeframe="weekly" />
          </TabsContent>
          
          <TabsContent value="daily">
            <UptimeMonitor timeframe="daily" />
          </TabsContent>
          
          <TabsContent value="monthly">
            <UptimeMonitor timeframe="monthly" />
          </TabsContent>

          <TabsContent value="latency">
            <LatencyMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}