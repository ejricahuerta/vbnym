"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Calendar, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GamesMapSkeleton } from "@/components/games/GameSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatGameCardTimeRail,
  formatGameTimeRangeLabel,
  formatTonightSpotMetaCaps,
  formatTonightSpotVenueLine,
  isGameToday,
  isGameThisWeek,
  spotsLeft,
  registrationNotYetOpen,
} from "@/lib/game-display";
import { parseGameTimeToParts } from "@/lib/game-time-input";
import { cn } from "@/lib/utils";
import type { Game, Signup } from "@/types/vbnym";

const GamesMap = dynamic(
  () => import("@/components/games/games-map").then((m) => m.GamesMap),
  {
    ssr: false,
    loading: () => <GamesMapSkeleton />,
  }
);

type DateFilter = "all" | "tonight" | "week";

type Props = {
  games: Game[];
  signupsByGameId: Record<string, Signup[]>;
  usingMock?: boolean;
  fetchError?: string | null;
  /** Omit outer chrome (background, padding) when hosted inside a parent card. */
  embedded?: boolean;
  /** Game IDs the current browser user is already signed up for. */
  myGameIds?: string[];
};

function matchesQuery(game: Game, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return (
    game.location.toLowerCase().includes(s) ||
    (game.address?.toLowerCase().includes(s) ?? false) ||
    (game.court?.toLowerCase().includes(s) ?? false) ||
    game.date.includes(s) ||
    formatGameTimeRangeLabel(game).toLowerCase().includes(s)
  );
}

/** Earliest start first (same calendar day). */
function compareGamesByStartTime(a: Game, b: Game): number {
  const pa = parseGameTimeToParts(a.time);
  const pb = parseGameTimeToParts(b.time);
  return pa.hour * 60 + pa.minute - (pb.hour * 60 + pb.minute);
}

function TonightCard({
  game,
  signups,
  isSignedUp,
}: {
  game: Game;
  signups: Signup[];
  isSignedUp: boolean;
}) {
  const left = spotsLeft(game, signups);
  const locked = game.listed === false || registrationNotYetOpen(game) || left <= 0;
  const timeRail = formatGameCardTimeRail(game);
  const metaCaps = formatTonightSpotMetaCaps(game, signups);
  const venueLine = formatTonightSpotVenueLine(game);
  const showVenueLine =
    venueLine.trim().length > 0 &&
    venueLine.trim().toLowerCase() !== game.location.trim().toLowerCase();

  return (
    <div
      className={cn(
        "flex min-h-0 items-stretch overflow-hidden rounded-2xl border border-accent/55 bg-card shadow-sm",
        "dark:border-accent/50 dark:bg-card/80"
      )}
    >
      {/* Start time + divider */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5 border-r border-border/70 py-3 pl-3 pr-2.5 sm:pl-3.5 sm:pr-3",
          "bg-muted/10 dark:bg-primary/5"
        )}
      >
        <div className="flex min-w-[2.75rem] flex-col items-center justify-center text-center sm:min-w-[3rem]">
          <span className="text-xl font-bold tabular-nums leading-none text-accent sm:text-2xl">
            {timeRail.primary}
          </span>
          {timeRail.secondary ? (
            <span className="mt-1 max-w-[4.5rem] text-[0.65rem] font-medium leading-tight text-muted-foreground">
              {timeRail.secondary}
            </span>
          ) : null}
        </div>
      </div>

      {/* Title stack */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2.5 pl-2 pr-1 sm:py-3 sm:pl-3">
        <p className="line-clamp-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent sm:text-[0.7rem]">
          {metaCaps}
        </p>
        <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">{game.location}</p>
        {showVenueLine ? (
          <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">{venueLine}</p>
        ) : null}
      </div>

      {/* Join / See details */}
      <div className="flex shrink-0 items-center pr-2.5 sm:pr-3">
        {isSignedUp ? (
          <Button
            size="sm"
            className={cn(
              "rounded-full px-4 font-bold shadow-none",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            asChild
          >
            <Link href={`/app/games/${game.id}`}>See details</Link>
          </Button>
        ) : locked ? (
          <Button
            type="button"
            size="sm"
            disabled
            className={cn(
              "rounded-full px-4 font-bold shadow-none",
              "border border-border bg-muted/40 text-muted-foreground"
            )}
          >
            {left <= 0 ? "Full" : registrationNotYetOpen(game) ? "Soon" : "—"}
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              "rounded-full px-5 font-bold shadow-none",
              "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
            asChild
          >
            <Link href={`/app/games/${game.id}`}>Join</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function GamesHome({
  games,
  signupsByGameId,
  usingMock,
  fetchError,
  embedded = false,
  myGameIds = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";
  const venueFilterId = searchParams.get("venue")?.trim() || null;
  const query = searchParams.get("q") ?? "";
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  function setQuery(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) params.set("q", next.trim());
    else params.delete("q");
    const s = params.toString();
    router.replace(s ? `/app?${s}` : "/app", { scroll: false });
  }

  const gamesForVenue = useMemo(() => {
    if (!venueFilterId) return games;
    return games.filter((g) => g.venue_id === venueFilterId);
  }, [games, venueFilterId]);

  const filteredGames = useMemo(() => {
    let result = gamesForVenue;
    if (view === "list") {
      result = result.filter((g) => matchesQuery(g, query));
    }
    if (dateFilter === "tonight") {
      result = result.filter((g) => isGameToday(g));
    } else if (dateFilter === "week") {
      result = result.filter((g) => isGameThisWeek(g));
    }
    return result;
  }, [gamesForVenue, query, view, dateFilter]);

  /** Today’s runs (venue + search), earliest first — shown above filters when not already in “Tonight” list mode. */
  const tonightGames = useMemo(() => {
    if (view !== "list") return [];
    const candidates = gamesForVenue
      .filter(isGameToday)
      .filter((g) => matchesQuery(g, query))
      .slice()
      .sort(compareGamesByStartTime);
    return candidates;
  }, [gamesForVenue, view, query]);

  const showTonightSpotlight = view === "list" && dateFilter !== "tonight" && tonightGames.length > 0;

  const tonightIds = useMemo(() => new Set(tonightGames.map((g) => g.id)), [tonightGames]);

  const listGames = useMemo(() => {
    if (!showTonightSpotlight) return filteredGames;
    return filteredGames.filter((g) => !tonightIds.has(g.id));
  }, [filteredGames, showTonightSpotlight, tonightIds]);

  const toolbarCount = view === "list" ? filteredGames.length : gamesForVenue.length;

  function clearVenueFilter() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("venue");
    const s = next.toString();
    router.push(s ? `/app?${s}` : "/app", { scroll: false });
  }

  const DATE_PILLS: { value: DateFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "tonight", label: "Tonight" },
    { value: "week", label: "This week" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col",
        embedded ? "w-full" : "flex-1 bg-background"
      )}
    >
      {/* Toolbar */}
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
          {/* Tonight — above filters (hidden when “Tonight” pill is on; list then carries those rows). */}
          {view === "list" && dateFilter !== "tonight" ? (
            <section aria-labelledby="tonight-heading" className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h2
                  id="tonight-heading"
                  className="text-base font-bold tracking-tight text-foreground sm:text-lg"
                >
                  Tonight
                </h2>
                {tonightGames.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setDateFilter("tonight")}
                    className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-accent hover:underline"
                  >
                    See all
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
              {tonightGames.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {tonightGames.map((game) => (
                    <li key={game.id}>
                      <TonightCard
                        game={game}
                        signups={signupsByGameId[game.id] ?? []}
                        isSignedUp={myGameIds.includes(game.id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  No games scheduled for tonight{query.trim() ? " that match your search" : ""}.
                </p>
              )}
            </section>
          ) : null}

          {/* Date filter pills + upcoming count */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {DATE_PILLS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDateFilter(value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    dateFilter === value
                      ? "border-accent bg-accent/15 text-accent-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:border-accent/50 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4 shrink-0 text-accent" aria-hidden />
              <span>{toolbarCount} upcoming</span>
            </span>
          </div>

          {venueFilterId ? (
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                Showing games at{" "}
                <span className="font-semibold text-foreground">
                  {gamesForVenue[0]?.location ?? "this venue"}
                </span>
                {gamesForVenue.length === 0 ? " (none scheduled)" : null}
              </span>
              <button
                type="button"
                onClick={clearVenueFilter}
                className="shrink-0 font-semibold text-primary underline underline-offset-4 hover:opacity-80"
              >
                Show all games
              </button>
            </p>
          ) : null}
          {view === "list" && embedded ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search games..."
                className="rounded-full border bg-background pl-10"
                aria-label="Search games"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Game list / map */}
      <div
        className={cn(
          "mx-auto w-full flex-1 space-y-4",
          embedded
            ? "max-w-none px-4 py-4 sm:px-6"
            : "max-w-3xl px-4 py-6 sm:px-6 lg:max-w-4xl xl:max-w-5xl"
        )}
      >
        {fetchError ? (
          <Card
            size="sm"
            className="border-destructive/30 bg-destructive/10 py-3 text-destructive shadow-none"
          >
            <CardContent className="px-3 py-0 text-sm">{fetchError}</CardContent>
          </Card>
        ) : null}
        {usingMock ? (
          <Card
            size="sm"
            className="border-amber-500/30 bg-amber-500/10 py-3 text-amber-950 shadow-none dark:text-amber-100"
          >
            <CardContent className="px-3 py-0 text-sm">
              Demo data: set{" "}
              <code className="rounded bg-black/5 px-1 dark:bg-white/10">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="rounded bg-black/5 px-1 dark:bg-white/10">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              to load real games.
            </CardContent>
          </Card>
        ) : null}

        {view === "list" ? (
          <>
            {filteredGames.length === 0 ? (
              <Card size="sm" className="border-dashed py-12 text-center shadow-none">
                <CardContent className="py-0 text-muted-foreground">
                  {games.length === 0
                    ? "No upcoming games. Check back soon."
                    : venueFilterId && gamesForVenue.length === 0
                      ? "No upcoming games at this venue."
                      : dateFilter !== "all"
                        ? "No games match this filter."
                        : "No games match your search."}
                </CardContent>
              </Card>
            ) : listGames.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                {showTonightSpotlight
                  ? "No other upcoming games match this view — tonight\u2019s runs are above."
                  : null}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {listGames.map((game) => (
                  <li key={game.id}>
                    <GameCard
                      game={game}
                      signups={signupsByGameId[game.id] ?? []}
                      isSignedUp={myGameIds.includes(game.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <GamesMap games={gamesForVenue} />
        )}
      </div>
    </div>
  );
}
