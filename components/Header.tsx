"use client"
import { Button } from "@/components/ui/button"

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary">
              <circle cx="12" cy="12" r="10" className="fill-current opacity-20"/>
              <path
                className="fill-current"
                d="M12 4v16M4 12h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Service Monitor</h1>
            <p className="text-sm text-muted-foreground">System Status Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('https://shardeum.org', '_blank')}
                  >
                      Shardeum
            
            <span className="sr-only">Visit the website</span>
          </Button>
        </div>
      </div>
    </header>
  )
}