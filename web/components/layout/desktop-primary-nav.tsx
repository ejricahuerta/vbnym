"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function navButtonClass(active: boolean) {
  return cn(
    "h-auto rounded-full px-3 py-2 text-sm font-medium shadow-none hover:bg-primary-foreground/10 hover:text-primary-foreground",
    active
      ? "bg-accent/20 text-accent font-semibold"
      : "text-primary-foreground/80"
  );
}

export function DesktopPrimaryNav() {
  const pathname = usePathname();
  const linkFor = (anchor: string) => (pathname === "/" ? anchor : `/${anchor}`);

  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary navigation">
      <Button variant="ghost" size="sm" asChild className={navButtonClass(pathname === "/")}>
        <Link href={linkFor("#games")} aria-current={pathname === "/" ? "page" : undefined}>
          Volleyball
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className={navButtonClass(false)}>
        <Link href={linkFor("#venue")}>Venues</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className={navButtonClass(false)}>
        <Link href={linkFor("#how-it-works")}>How it works</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className={navButtonClass(false)}>
        <Link href={linkFor("#about")}>About</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className={navButtonClass(pathname === "/community")}>
        <Link href="/community" aria-current={pathname === "/community" ? "page" : undefined}>
          Community
        </Link>
      </Button>
    </nav>
  );
}
