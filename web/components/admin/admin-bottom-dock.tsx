"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Calendar, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { href: "/admin/games", label: "Games", Icon: Calendar },
  { href: "/admin/venues", label: "Venues", Icon: Building2 },
  { href: "/admin/signups", label: "Signups", Icon: Users },
  { href: "/admin/payments", label: "Payments", Icon: CreditCard },
];

function linkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AdminBottomDock() {
  const pathname = usePathname();

  const itemClass = (href: string) =>
    cn(
      "h-auto min-h-[3.25rem] flex-1 rounded-none px-0.5 font-normal text-primary opacity-80 shadow-none hover:bg-muted hover:text-primary sm:px-1",
      linkActive(pathname, href) && "opacity-100 font-semibold text-accent hover:text-accent"
    );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card text-primary md:hidden",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
      aria-label="Admin navigation"
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-1 pt-1 lg:max-w-4xl">
        {ITEMS.map(({ href, label, Icon }) => (
          <Button key={href} variant="ghost" asChild className={itemClass(href)}>
            <Link
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-center text-[0.6rem] font-semibold uppercase leading-tight tracking-wide"
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
