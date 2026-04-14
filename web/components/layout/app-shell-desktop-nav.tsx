"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function linkClass(active: boolean) {
  return cn(
    "text-sm font-medium tracking-tight transition-colors hover:text-footer-foreground",
    active ? "text-accent" : "text-app-chrome-muted"
  );
}

export function AppShellDesktopNav() {
  const pathname = usePathname();
  const gamesActive =
    pathname === "/app" || pathname.startsWith("/app/games/");
  const communityActive = pathname === "/community";

  return (
    <nav
      className="hidden items-center gap-8 lg:flex xl:gap-10"
      aria-label="App navigation"
    >
      <Link href="/app" className={linkClass(gamesActive)} aria-current={gamesActive ? "page" : undefined}>
        Games
      </Link>
      <Link href="/#venue" className={linkClass(false)}>
        Venues
      </Link>
      <Link
        href="/community"
        className={linkClass(communityActive)}
        aria-current={communityActive ? "page" : undefined}
      >
        Community
      </Link>
    </nav>
  );
}
