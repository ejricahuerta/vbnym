import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShellDesktopNav } from "@/components/layout/app-shell-desktop-nav";
import { AppShellGamesSearch } from "@/components/layout/app-shell-games-search";
import { AppShellGamesViewToggle } from "@/components/layout/app-shell-games-view-toggle";
import { AppShellMobileHeader } from "@/components/layout/app-shell-mobile-header";

export function AppShellHeader() {
  return (
    <header className="sticky top-0 z-40 bg-app-chrome-bg pt-[env(safe-area-inset-top)] text-footer-foreground backdrop-blur-md lg:border-b lg:border-white/10">
      <div className="lg:hidden">
        <AppShellMobileHeader />
      </div>

      <div className="mx-auto hidden min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:flex lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
          <Button
            variant="ghost"
            asChild
            className="h-auto min-w-0 shrink-0 justify-start gap-3 px-1 py-1.5 text-left text-footer-foreground shadow-none hover:bg-white/5 hover:text-footer-foreground"
          >
            <Link href="/app" className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-[0.8125rem] font-bold leading-none text-accent-foreground"
                aria-hidden
              >
                VB
              </span>
              <span className="min-w-0 flex flex-col leading-tight">
                <span className="font-heading text-base font-bold tracking-tight sm:text-lg">
                  <span className="block truncate sm:max-w-none" title="North York & Markham">
                    NY & Markham
                  </span>
                </span>
                <span className="mt-0.5 text-xs font-medium text-app-chrome-muted sm:text-[0.8125rem]">
                  Volleyball Community
                </span>
              </span>
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
            className="h-10 shrink-0 gap-1 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-none hover:bg-accent/90"
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
