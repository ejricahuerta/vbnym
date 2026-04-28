"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Calendar, House, ShieldAlert, UserRoundCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { href: "/admin", label: "Home", Icon: House },
  { href: "/admin/games", label: "Events", Icon: Calendar },
  { href: "/admin/hosts", label: "Hosts", Icon: UserRoundCheck },
  { href: "/admin/players", label: "Players", Icon: Users },
  { href: "/admin/venues", label: "Venues", Icon: Building2 },
  { href: "/admin/reports", label: "Reports", Icon: ShieldAlert },
];

function linkActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AdminBottomDock() {
  const pathname = usePathname();

  const itemClass = (href: string) =>
    cn(
      "h-auto min-h-[3.25rem] flex-1 rounded-md border-2 border-transparent px-0.5 font-normal text-foreground/80 shadow-none hover:border-[var(--ink)] hover:bg-[var(--paper)] hover:text-foreground sm:px-1",
      linkActive(pathname, href) && "border-[var(--ink)] bg-accent text-[var(--ink)] hover:text-[var(--ink)]"
    );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t-2 border-border bg-background text-foreground md:hidden",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
      aria-label="Admin navigation"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-6 items-stretch px-1 pt-1 lg:max-w-4xl">
        {ITEMS.map(({ href, label, Icon }) => (
          <Button key={href} variant="ghost" asChild className={itemClass(href)}>
            <Link
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-center text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.08em]"
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
