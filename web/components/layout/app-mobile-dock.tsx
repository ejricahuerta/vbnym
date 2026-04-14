"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type DockTab = "home" | "schedule" | "venues" | "community";

function activeTab(pathname: string): DockTab {
  if (pathname === "/community") return "community";
  if (pathname === "/app/my-games") return "schedule";
  if (pathname === "/app" || pathname.startsWith("/app/games/")) return "home";
  return "home";
}

function DockLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-end gap-1 px-1 pb-2.5 pt-2 text-[0.6875rem] font-semibold leading-none tracking-tight transition-colors",
        isActive ? "text-accent" : "text-app-chrome-muted hover:text-footer-foreground/90"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-6 shrink-0 stroke-[1.75]" aria-hidden />
      <span>{label}</span>
      <span
        className={cn(
          "mt-0.5 h-1 w-1 shrink-0 rounded-full transition-opacity",
          isActive ? "bg-accent opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
    </Link>
  );
}

export function AppMobileDock() {
  const pathname = usePathname();
  const current = activeTab(pathname);

  return (
    <nav
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      )}
      aria-label="App navigation"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-lg items-stretch justify-around",
          "rounded-2xl border border-white/10 bg-app-chrome-bg/98 shadow-lg backdrop-blur-lg"
        )}
      >
        <DockLink href="/app" label="Home" icon={Home} isActive={current === "home"} />
        <DockLink
          href="/app/my-games"
          label="Schedule"
          icon={CalendarDays}
          isActive={current === "schedule"}
        />
        <DockLink href="/#venue" label="Venues" icon={MapPin} isActive={current === "venues"} />
        <DockLink
          href="/community"
          label="Community"
          icon={Users}
          isActive={current === "community"}
        />
      </div>
    </nav>
  );
}
