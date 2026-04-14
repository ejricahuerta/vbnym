"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, Compass, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DockSection = "games" | "venues" | "myGames" | "community";

function activeSection(pathname: string, hash: string): DockSection {
  if (pathname === "/community") return "community";
  if (pathname === "/my-games") return "myGames";
  if (pathname.startsWith("/games/")) return "games";
  if (pathname !== "/") return "games";
  const h = (hash || "#games").toLowerCase();
  if (h === "#venue" || h.startsWith("#venue")) return "venues";
  return "games";
}

export function MobileDock() {
  const pathname = usePathname();
  const isMarketingHome = pathname === "/";
  const navLink = (anchor: string) => (isMarketingHome ? anchor : `/${anchor}`);
  const homeSectionHref = isMarketingHome ? navLink("#games") : "/#games";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  const current = activeSection(pathname, hash);

  const itemClass = (section: DockSection) =>
    cn(
      "h-auto min-h-[3.25rem] flex-1 rounded-none px-1 font-normal text-foreground/70 shadow-none hover:bg-muted hover:text-foreground",
      current === section && "text-accent font-semibold hover:text-accent"
    );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 text-foreground backdrop-blur-lg md:hidden",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0 px-1 pt-1">
        <Button variant="ghost" asChild className={itemClass("games")}>
          <Link
            href={homeSectionHref}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-center text-[0.625rem] font-semibold uppercase leading-tight tracking-wide"
          >
            <Compass className="size-5 shrink-0" aria-hidden />
            Games
          </Link>
        </Button>
        <Button variant="ghost" asChild className={itemClass("venues")}>
          <Link
            href={navLink("#venue")}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-center text-[0.625rem] font-semibold uppercase leading-tight tracking-wide"
          >
            <Building2 className="size-5 shrink-0" aria-hidden />
            Venues
          </Link>
        </Button>
        <Button variant="ghost" asChild className={itemClass("myGames")}>
          <Link
            href="/my-games"
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-center text-[0.625rem] font-semibold uppercase leading-tight tracking-wide"
          >
            <CalendarDays className="size-5 shrink-0" aria-hidden />
            My games
          </Link>
        </Button>
        <Button variant="ghost" asChild className={itemClass("community")}>
          <Link
            href="/community"
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-center text-[0.625rem] font-semibold uppercase leading-tight tracking-wide"
          >
            <MessagesSquare className="size-5 shrink-0" aria-hidden />
            Community
          </Link>
        </Button>
      </div>
    </nav>
  );
}
