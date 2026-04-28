import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShellDesktopNav } from "@/components/layout/app-shell-desktop-nav";
import { AppShellGamesSearch } from "@/components/layout/app-shell-games-search";
import { AppShellGamesViewToggle } from "@/components/layout/app-shell-games-view-toggle";
import { AppShellMobileHeader } from "@/components/layout/app-shell-mobile-header";
import { SixBackLogo } from "@/components/shared/SixBackLogo";

export function AppShellHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-background pt-[env(safe-area-inset-top)] text-foreground backdrop-blur-md">
      <div className="lg:hidden">
        <AppShellMobileHeader />
      </div>

      <div className="mx-auto hidden min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:flex lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
          <Button
            variant="ghost"
            asChild
            className="h-auto min-w-0 shrink-0 justify-start gap-3 px-1 py-1.5 text-left text-foreground shadow-none hover:bg-muted/70 hover:text-foreground"
          >
            <Link href="/app" className="flex min-w-0 items-center gap-3">
              <SixBackLogo showWordmark />
            </Link>
          </Button>

          <Suspense fallback={null}>
            <AppShellDesktopNav />
          </Suspense>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-3 lg:gap-4">
          <div className="flex min-w-0 items-center gap-2 lg:gap-3">
            <Suspense fallback={null}>
              <AppShellGamesSearch className="w-[min(100%,20rem)] xl:w-[22rem]" />
            </Suspense>
            <Suspense fallback={null}>
              <AppShellGamesViewToggle />
            </Suspense>
          </div>
          <Button
            asChild
            size="sm"
            className="h-10 shrink-0 gap-1 rounded-md bg-accent px-5 text-sm font-bold text-accent-foreground"
          >
            <Link href="/app/my-games" className="flex items-center gap-1">
              <CalendarDays className="size-4 shrink-0 stroke-[2.5]" aria-hidden />
              My Games
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
