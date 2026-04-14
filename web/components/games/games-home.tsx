"use client";

import dynamic from "next/dynamic";
import { Calendar, List, Map, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GameCard } from "@/components/games/game-card";
import type { Game, Signup } from "@/types/vbnym";
import { formatGameTimeRangeLabel } from "@/lib/game-display";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MobileDock } from "@/components/layout/mobile-dock";
import { cn } from "@/lib/utils";

const GamesMap = dynamic(
  () => import("@/components/games/games-map").then((m) => m.GamesMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[min(52vh,480px)] w-full rounded-xl md:h-[min(55vh,520px)] lg:h-[min(60vh,600px)]" />
    ),
  }
);

type Props = {
  games: Game[];
  signupsByGameId: Record<string, Signup[]>;
  usingMock?: boolean;
  fetchError?: string | null;
  /** Omit outer chrome (background, padding, MobileDock) when hosted inside a parent card. */
  embedded?: boolean;
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

export function GamesHome({
  games,
  signupsByGameId,
  usingMock,
  fetchError,
  embedded = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";
  const venueFilterId = searchParams.get("venue")?.trim() || null;
  const [query, setQuery] = useState("");

  const gamesForVenue = useMemo(() => {
    if (!venueFilterId) return games;
    return games.filter((g) => g.venue_id === venueFilterId);
  }, [games, venueFilterId]);

  const filteredGames = useMemo(() => {
    if (view === "list") {
      return gamesForVenue.filter((g) => matchesQuery(g, query));
    }
    return gamesForVenue;
  }, [gamesForVenue, query, view]);

  const toolbarCount = view === "list" ? filteredGames.length : gamesForVenue.length;

  function clearVenueFilter() {
    const q = new URLSearchParams(searchParams.toString());
    q.delete("venue");
    const s = q.toString();
    router.push(s ? `/?${s}` : "/", { scroll: false });
  }

  function setView(next: "list" | "map") {
    const q = new URLSearchParams(searchParams.toString());
    if (next === "map") q.set("view", "map");
    else q.delete("view");
    const s = q.toString();
    router.push(s ? `/?${s}` : "/", { scroll: false });
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        embedded ? "w-full" : "flex-1 bg-background pb-24 md:pb-6"
      )}
    >
      {/* Toolbar: toggle + search */}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => {
                if (v === "list" || v === "map") setView(v);
              }}
              variant="outline"
              spacing={2}
              className="rounded-full bg-muted/50 p-1"
            >
              <ToggleGroupItem
                value="list"
                aria-label="List view"
                className="gap-1.5 rounded-full px-3 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              >
                <List className="size-4" />
                List
              </ToggleGroupItem>
              <ToggleGroupItem
                value="map"
                aria-label="Map view"
                className="gap-1.5 rounded-full px-3 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              >
                <Map className="size-4" />
                Map
              </ToggleGroupItem>
            </ToggleGroup>
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
          {view === "list" ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by location or date..."
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
          filteredGames.length === 0 ? (
            <Card size="sm" className="border-dashed py-12 text-center shadow-none">
              <CardContent className="py-0 text-muted-foreground">
                {games.length === 0
                  ? "No upcoming games. Check back soon."
                  : venueFilterId && gamesForVenue.length === 0
                    ? "No upcoming games at this venue."
                    : "No games match your search."}
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start xl:gap-4">
              {filteredGames.map((game) => (
                <li key={game.id}>
                  <GameCard game={game} signups={signupsByGameId[game.id] ?? []} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <GamesMap games={gamesForVenue} />
        )}
      </div>

      {embedded ? null : <MobileDock />}
    </div>
  );
}

export function GamesHomeSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="ml-auto h-5 w-24 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="hidden h-52 w-full rounded-xl xl:block" />
      </div>
    </div>
  );
}
