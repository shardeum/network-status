import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UptimeMonitor } from "@/components/UptimeMonitor"
import { LatencyMonitor } from '@/components/LatencyMonitor'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shardeum Network Status Monitor</h1>
        <UptimeMonitor timeframe="daily" />
        
        
      </div>
    </main>
  )
}