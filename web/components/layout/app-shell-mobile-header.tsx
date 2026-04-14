import { Suspense } from "react";
import { AppShellGamesSearch } from "@/components/layout/app-shell-games-search";
import { AppShellGamesViewToggle } from "@/components/layout/app-shell-games-view-toggle";

export function AppShellMobileHeader() {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

  return (
    <div className="border-b border-white/10 bg-app-chrome-bg px-4 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-5">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <div>
          <p className="font-heading text-2xl font-bold tracking-tight text-footer-foreground">
            Hey there!
          </p>
          <p className="mt-1 text-sm font-medium text-app-chrome-muted">
            {weekday} · North York & Markham
          </p>
        </div>
        <Suspense fallback={null}>
          <div className="flex w-full items-center gap-2">
            <AppShellGamesSearch
              variant="mobile"
              className="min-w-0 flex-1"
              placeholder="Search games, venues, levels..."
            />
            <AppShellGamesViewToggle compact />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
