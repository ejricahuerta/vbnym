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
  const myGamesActive = pathname === "/app/my-games";

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex"
      aria-label="Primary navigation"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-0.5">
        <Button variant="ghost" size="sm" asChild className={navButtonClass(false)}>
          <Link href={linkFor("#how-it-works")}>How it works</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className={navButtonClass(false)}>
          <Link href={linkFor("#venue")}>Venues</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className={navButtonClass(false)}>
          <Link href={linkFor("#about")}>About</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className={navButtonClass(pathname === "/community")}>
          <Link href="/community" aria-current={pathname === "/community" ? "page" : undefined}>
            Community
          </Link>
        </Button>
      </div>
      <Button
        asChild
        size="sm"
        className="h-9 shrink-0 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 sm:h-10 sm:px-5"
      >
        <Link href="/app/my-games" aria-current={myGamesActive ? "page" : undefined}>
          My Games
        </Link>
      </Button>
    </nav>
  );
}
