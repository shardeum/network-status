import { LatencyMonitor } from '@/components/LatencyMonitor';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="max-w-7xl mx-auto">
        <LatencyMonitor />
      </div>
    </main>
  );
}
