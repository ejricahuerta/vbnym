import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DesktopPrimaryNav } from "@/components/layout/desktop-primary-nav";
import { FindMyGamesDialog } from "@/components/games/find-my-games-dialog";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary/98 pt-[env(safe-area-inset-top)] text-primary-foreground backdrop-blur-md">
      <div className="flex min-h-14 w-full items-center justify-between gap-2 px-3 sm:min-h-16 sm:gap-3 sm:px-6 lg:gap-6 lg:px-8">
        <Button
          variant="ghost"
          asChild
          className="h-auto min-w-0 flex-1 justify-start gap-2 px-1.5 py-1.5 text-left text-primary-foreground shadow-none hover:bg-primary-foreground/10 hover:text-primary-foreground sm:flex-none sm:gap-2.5 sm:px-2"
        >
          <Link href="/" className="flex min-w-0 items-center justify-start gap-2 sm:gap-2.5">
            <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5 sm:size-9">
              <Image
                src="/nym-logo.png"
                alt=""
                width={36}
                height={36}
                className="object-contain p-0.5"
                priority
              />
            </span>
            <span className="min-w-0 flex flex-col leading-none">
              <span className="font-heading text-sm font-semibold tracking-tight sm:text-lg">
                <span className="block truncate sm:hidden" title="North York | Markham">
                  NYM
                </span>
                <span className="hidden sm:inline">North York | Markham</span>
              </span>
              <span className="mt-0.5 hidden text-xs font-medium text-primary-foreground/70 sm:mt-0 sm:block">
                Volleyball
              </span>
            </span>
          </Link>
        </Button>
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          <Suspense fallback={null}>
            <DesktopPrimaryNav />
          </Suspense>
          <FindMyGamesDialog>
            <Button
              size="sm"
              className="h-9 shrink-0 rounded-full bg-accent px-3 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 sm:h-10 sm:px-5 sm:text-sm"
            >
              My games
            </Button>
          </FindMyGamesDialog>
        </div>
      </div>
    </header>
  );
}
