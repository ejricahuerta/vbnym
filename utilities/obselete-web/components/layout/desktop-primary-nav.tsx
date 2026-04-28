"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function navLinkClass(active: boolean) {
  return cn(
    "px-1 text-[13px] font-black uppercase tracking-[0.08em] text-[var(--ink)] transition-opacity",
    active
      ? "opacity-100"
      : "opacity-80 hover:opacity-100"
  );
}

export function DesktopPrimaryNav() {
  const pathname = usePathname();
  const isBrowse = pathname === "/app" || pathname.startsWith("/app/games/");
  const isHost = pathname === "/host";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="hidden min-w-0 flex-1 items-center justify-between gap-6 md:flex">
      <nav
        className="mx-auto flex min-w-0 items-center gap-8 lg:gap-10"
        aria-label="Primary navigation"
      >
        <Link href="/app" className={navLinkClass(isBrowse)} aria-current={isBrowse ? "page" : undefined}>
          Browse
        </Link>
        <Link href="/host" className={navLinkClass(isHost)} aria-current={isHost ? "page" : undefined}>
          Host
        </Link>
        <Link href="/admin" className={navLinkClass(isAdmin)} aria-current={isAdmin ? "page" : undefined}>
          Admin
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex h-9 items-center rounded-[10px] border-2 border-[var(--ink)] bg-[var(--paper)] px-4 text-[12px] font-black uppercase tracking-[0.08em] text-[var(--ink)]"
        >
          Sign In
        </Link>
        <Link
          href="/app"
          className="inline-flex h-9 items-center rounded-[10px] border-2 border-[var(--ink)] bg-accent px-4 text-[12px] font-black uppercase tracking-[0.08em] text-[var(--ink)]"
        >
          Find A Game
        </Link>
      </div>
    </div>
  );
}
