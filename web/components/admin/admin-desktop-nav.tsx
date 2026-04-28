"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/games", label: "Events" },
  { href: "/admin/hosts", label: "Hosts" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/reports", label: "Reports" },
] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex"
      aria-label="Admin sections"
    >
      {LINKS.map(({ href, label }) => {
        const active = linkActive(pathname, href);
        return (
          <Button
            key={href}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "h-9 shrink-0 whitespace-nowrap rounded-md border-2 border-transparent px-3 text-xs font-semibold uppercase tracking-[0.08em] shadow-none",
              active &&
                "border-[var(--ink)] bg-accent text-[var(--ink)] hover:bg-accent hover:text-[var(--ink)]",
              !active &&
                "text-muted-foreground hover:border-[var(--ink)] hover:bg-[var(--paper)] hover:text-foreground"
            )}
          >
            <Link href={href}>{label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
