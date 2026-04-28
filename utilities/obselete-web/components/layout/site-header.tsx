import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DesktopPrimaryNav } from "@/components/layout/desktop-primary-nav";
import { SixBackLogo } from "@/components/shared/SixBackLogo";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-background/98 pt-[env(safe-area-inset-top)] text-foreground backdrop-blur-md">
      <div className="flex min-h-14 w-full items-center justify-between gap-2 px-3 sm:min-h-16 sm:gap-3 sm:px-6 lg:gap-6 lg:px-8">
        <Button
          variant="ghost"
          asChild
          className="h-auto min-w-0 flex-1 justify-start gap-2 px-1.5 py-1.5 text-left text-foreground shadow-none hover:bg-muted/70 hover:text-foreground sm:flex-none sm:gap-2.5 sm:px-2"
        >
          <Link href="/" className="flex min-w-0 items-center justify-start gap-2 sm:gap-2.5">
            <SixBackLogo showWordmark />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
          <Button
            asChild
            size="sm"
            className="h-9 shrink-0 rounded-md border-2 border-[var(--ink)] bg-accent px-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--ink)] md:hidden sm:h-10 sm:px-5 sm:text-sm"
          >
            <Link href="/app">Browse</Link>
          </Button>
          <Suspense fallback={null}>
            <DesktopPrimaryNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
