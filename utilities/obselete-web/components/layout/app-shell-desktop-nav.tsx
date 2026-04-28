"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function linkClass(active: boolean) {
  return cn(
    "rounded-md border-2 border-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
    active
      ? "border-[var(--ink)] bg-accent text-[var(--ink)]"
      : "text-muted-foreground hover:border-[var(--ink)] hover:bg-[var(--paper)] hover:text-foreground"
  );
}

export function AppShellDesktopNav() {
  const pathname = usePathname();
  const gamesActive =
    pathname === "/app" || pathname.startsWith("/app/games/");
  const communityActive = pathname === "/community";
  const leaguesActive = pathname.startsWith("/leagues");

  return (
    <nav
      className="hidden items-center gap-2 lg:flex"
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
      <Link
        href="/leagues"
        className={linkClass(leaguesActive)}
        aria-current={leaguesActive ? "page" : undefined}
      >
        Leagues
      </Link>
    </nav>
  );
}
