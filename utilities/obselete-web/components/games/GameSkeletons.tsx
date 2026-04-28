import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Matches `game-card.tsx` CTA column width. */
const gameCardCtaWidthClass = "w-full min-w-0 sm:w-[11rem]";

export function GameCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden rounded-xl border border-accent/35 py-0 shadow-sm ring-0",
        className
      )}
    >
      <div className="flex min-h-[7.5rem] items-stretch">
        <div
          className={cn(
            "relative flex w-[4.25rem] shrink-0 flex-col sm:w-[4.75rem] md:w-[14%] md:max-w-[6.5rem]",
            "border-r border-border/80 bg-muted/25 dark:bg-primary/10"
          )}
        >
          <Skeleton className="absolute inset-y-0 left-0 w-1 rounded-none" aria-hidden />
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-3 pl-3.5 pr-2 sm:py-4 sm:pl-4">
            <Skeleton className="h-8 w-9 rounded-md sm:h-9 sm:w-10" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        </div>

        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-4"
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:min-w-0">
            <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="hidden h-3 w-24 rounded sm:block" />
              </div>
              <Skeleton className="size-8 shrink-0 rounded-md sm:hidden" />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Skeleton className="h-5 max-w-[20rem] rounded-md sm:h-6" />
              <div className="flex min-w-0 flex-col gap-1">
                <Skeleton className="h-3.5 w-40 rounded-md sm:w-52" />
                <Skeleton className="h-3.5 max-w-[18rem] rounded-md" />
              </div>
            </div>
          </div>

          <div className={cn("mt-auto flex shrink-0 flex-col gap-2 sm:mt-0", gameCardCtaWidthClass)}>
            <div className="flex w-full min-w-0 items-center justify-between gap-2">
              <div className="flex -space-x-2">
                <Skeleton className="size-7 rounded-full border-2 border-card sm:size-8" />
                <Skeleton className="size-7 rounded-full border-2 border-card sm:size-8" />
                <Skeleton className="size-7 rounded-full border-2 border-card sm:size-8" />
              </div>
              <Skeleton className="hidden size-8 shrink-0 rounded-md sm:block" />
            </div>
            <div className="flex w-full flex-col gap-1">
              <Skeleton className="ms-auto h-3 w-14 rounded" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TonightCardSkeleton() {
  return (
    <div
      className={cn(
        "flex min-h-0 items-stretch overflow-hidden rounded-2xl border border-accent/55 bg-card shadow-sm",
        "dark:border-accent/50 dark:bg-card/80"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5 border-r border-border/70 py-3 pl-3 pr-2.5 sm:pl-3.5 sm:pr-3",
          "bg-muted/10 dark:bg-primary/5"
        )}
      >
        <div className="flex min-w-[2.75rem] flex-col items-center justify-center gap-1.5 sm:min-w-[3rem]">
          <Skeleton className="h-7 w-10 rounded-md sm:h-8 sm:w-11" />
          <Skeleton className="h-2.5 w-12 rounded" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-2.5 pl-2 pr-1 sm:py-3 sm:pl-3">
        <Skeleton className="h-3 w-32 rounded sm:w-40" />
        <Skeleton className="h-4 w-full max-w-[14rem] rounded-md sm:h-5" />
        <Skeleton className="h-3 w-full max-w-[12rem] rounded sm:max-w-[16rem]" />
      </div>
      <div className="flex shrink-0 items-center pr-2.5 sm:pr-3">
        <Skeleton className="h-8 w-16 rounded-full sm:w-[4.5rem]" />
      </div>
    </div>
  );
}

export function GamesMapSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "h-[min(52vh,480px)] w-full rounded-xl md:h-[min(55vh,520px)] lg:h-[min(60vh,600px)]",
        className
      )}
    />
  );
}

export function GamesHomeSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col",
        embedded ? "w-full" : "flex-1 bg-background"
      )}
    >
      <div
        className={cn(
          "border-b border-border/60",
          embedded ? "bg-transparent" : "bg-card/80 backdrop-blur-sm"
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-3 py-3",
            embedded
              ? "max-w-none px-4 sm:px-6"
              : "max-w-3xl px-4 sm:px-6 lg:max-w-4xl xl:max-w-5xl"
          )}
        >
          <section className="space-y-2" aria-hidden>
            <div className="flex items-baseline justify-between gap-3">
              <Skeleton className="h-6 w-20 rounded-md sm:h-7" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <TonightCardSkeleton />
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-12 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>

      <div
        className={cn(
          "mx-auto w-full flex-1 space-y-4",
          embedded ? "max-w-none px-4 py-4 sm:px-6" : "max-w-3xl px-4 py-6 sm:px-6 lg:max-w-4xl xl:max-w-5xl"
        )}
      >
        <ul className="flex flex-col gap-3" aria-busy aria-label="Loading games">
          <li>
            <GameCardSkeleton />
          </li>
          <li>
            <GameCardSkeleton />
          </li>
          <li>
            <GameCardSkeleton />
          </li>
        </ul>
      </div>
    </div>
  );
}

export function MyGamesPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:max-w-4xl lg:py-10 xl:max-w-6xl 2xl:max-w-6xl">
      <div className="border-b border-border/60 pb-6">
        <Skeleton className="mb-3 h-8 w-36 rounded-md" />
        <Skeleton className="h-9 w-48 rounded-md sm:h-10 sm:w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl rounded-md" />
        <Skeleton className="mt-2 h-4 w-full max-w-md rounded-md" />
      </div>
      <div className="mt-6 space-y-3 sm:mt-8" aria-busy aria-label="Loading your games">
        <GameCardSkeleton />
        <GameCardSkeleton />
      </div>
    </main>
  );
}

export function GameDetailPageSkeleton() {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col self-center pb-24 md:pb-0",
        "lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,26rem)_1fr] lg:grid-rows-1 lg:items-start lg:gap-x-0",
        "xl:grid-cols-[minmax(0,28rem)_1fr]"
      )}
      aria-busy
      aria-label="Loading game details"
    >
      <section className="bg-primary px-4 pb-8 pt-3 text-primary-foreground sm:px-6 sm:pb-10 lg:sticky lg:top-6 lg:m-6 lg:mr-0 lg:flex lg:min-h-0 lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:rounded-2xl lg:px-8 lg:pb-10 lg:pt-8 lg:shadow-xl">
        <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-none">
          <Skeleton className="h-8 w-32 rounded-md bg-primary-foreground/15" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full bg-primary-foreground/15" />
            <Skeleton className="size-8 rounded-md bg-primary-foreground/15" />
          </div>
          <Skeleton className="h-10 w-full max-w-[18rem] rounded-lg bg-primary-foreground/15" />
          <Skeleton className="h-4 w-full max-w-xs rounded-md bg-primary-foreground/10" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full max-w-sm rounded-md bg-primary-foreground/10" />
            <Skeleton className="h-4 w-full max-w-md rounded-md bg-primary-foreground/10" />
          </div>
          <Skeleton className="mt-4 h-3 w-24 rounded bg-primary-foreground/10" />
          <Skeleton className="h-8 w-40 rounded-md bg-primary-foreground/15" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="size-10 rounded-full border-2 border-primary-foreground/20 bg-primary-foreground/10" />
            <Skeleton className="size-10 rounded-full border-2 border-primary-foreground/20 bg-primary-foreground/10" />
            <Skeleton className="size-10 rounded-full border-2 border-primary-foreground/20 bg-primary-foreground/10" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl bg-primary-foreground/10" />
        </div>
      </section>

      <section className="relative z-10 -mt-6 rounded-t-3xl border border-b-0 bg-card px-4 pb-10 pt-6 shadow-sm sm:px-6 sm:pt-8 lg:z-auto lg:mt-0 lg:self-start lg:rounded-none lg:border-0 lg:shadow-none lg:px-8 lg:pt-10 xl:px-10">
        <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-2xl xl:max-w-3xl">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 rounded-md" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </section>
    </div>
  );
}
