"use client";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src="/shardeum-logo.png"
              alt="Shardeum Logo"
              className="transition-all dark:invert"
              width={200}
              height={200}
            />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/realtime">
            <Button variant="ghost">Realtime</Button>
          </Link>
          <Link href="/latency">
            <Button variant="ghost">Latency</Button>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
