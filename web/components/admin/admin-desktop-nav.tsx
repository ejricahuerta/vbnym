"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/games", label: "Games" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/signups", label: "Signups" },
  { href: "/admin/payments", label: "Payments" },
] as const;

function linkActive(pathname: string, href: string): boolean {
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
              "h-9 shrink-0 whitespace-nowrap px-3 font-medium shadow-none",
              active &&
                "bg-accent text-white hover:bg-accent hover:text-white"
            )}
          >
            <Link href={href}>{label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
