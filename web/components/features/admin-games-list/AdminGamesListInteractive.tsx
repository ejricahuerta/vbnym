"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { AdminGameCard } from "@/components/admin/admin-game-card";
import { DeleteResourceDialog } from "@/components/admin/delete-resource-dialog";
import { SearchInputGroup } from "@/components/shared/SearchInputGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatGameDateLong, formatGameTimeRangeLabel } from "@/lib/game-display";
import { gameMatchesSearchQuery } from "@/lib/game-search-match";
import {
  getAdminGameSchedulePhase,
  gameStartUtcMs,
  type AdminGameSchedulePhase,
} from "@/lib/registration-policy";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/action-result";
import type { Game } from "@/types/vbnym";

type PhaseTab = "all" | AdminGameSchedulePhase;

type SortMode = "start-asc" | "start-desc" | "date-asc" | "date-desc" | "location-asc" | "location-desc";

type ListedFilter = "all" | "listed" | "invite_only";

type Props = {
  games: Game[];
  gameImageSrcById: Record<string, string>;
  deleteGameAction: (formData: FormData) => Promise<ActionResult<null>>;
  /** Wall clock from the server render; keeps tab counts and phases stable for this paint. */
  referenceTimeMs: number;
};

function sortGames(list: Game[], mode: SortMode): Game[] {
  const copy = [...list];
  const [key, dir] = mode.split("-") as [string, "asc" | "desc"];
  const asc = dir === "asc";
  copy.sort((a, b) => {
    let c = 0;
    if (key === "start") {
      const ma = gameStartUtcMs(a);
      const mb = gameStartUtcMs(b);
      if (ma == null && mb == null) c = a.date.localeCompare(b.date);
      else if (ma == null) c = 1;
      else if (mb == null) c = -1;
      else c = ma - mb;
    } else if (key === "date") {
      c = a.date.localeCompare(b.date);
      if (c === 0) {
        const ma = gameStartUtcMs(a) ?? 0;
        const mb = gameStartUtcMs(b) ?? 0;
        c = ma - mb;
      }
    } else {
      c = a.location.localeCompare(b.location, undefined, { sensitivity: "base" });
    }
    return asc ? c : -c;
  });
  return copy;
}

function TabCount({ n }: { n: number }) {
  return (
    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
      {n}
    </Badge>
  );
}

export function AdminGamesListInteractive({
  games,
  gameImageSrcById,
  deleteGameAction,
  referenceTimeMs,
}: Props) {
  const [tab, setTab] = useState<PhaseTab>("upcoming");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("start-asc");
  const [listedFilter, setListedFilter] = useState<ListedFilter>("all");

  const counts = useMemo(() => {
    let ongoing = 0;
    let upcoming = 0;
    let past = 0;
    for (const g of games) {
      const p = getAdminGameSchedulePhase(g, referenceTimeMs);
      if (p === "ongoing") ongoing += 1;
      else if (p === "upcoming") upcoming += 1;
      else past += 1;
    }
    return { all: games.length, ongoing, upcoming, past };
  }, [games, referenceTimeMs]);

  const filteredSorted = useMemo(() => {
    let list = games;
    if (listedFilter === "listed") list = list.filter((g) => g.listed !== false);
    else if (listedFilter === "invite_only") list = list.filter((g) => g.listed === false);
    list = list.filter((g) => gameMatchesSearchQuery(g, search));
    if (tab !== "all") {
      list = list.filter((g) => getAdminGameSchedulePhase(g, referenceTimeMs) === tab);
    }
    return sortGames(list, sortMode);
  }, [games, listedFilter, referenceTimeMs, search, sortMode, tab]);

  const emptyLabel =
    tab === "all"
      ? "No games match your filters."
      : tab === "ongoing"
        ? "No games in progress right now."
        : tab === "upcoming"
          ? "No upcoming games match your filters."
          : "No past games match your filters.";

  const listPanel = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <SearchInputGroup
            id="admin-games-search"
            placeholder="Location, date, court, time…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="max-w-md"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground">Sort</span>
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger size="sm" className="w-full min-w-[min(100vw-2rem,220px)] sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start-asc">Start time (soonest)</SelectItem>
              <SelectItem value="start-desc">Start time (latest)</SelectItem>
              <SelectItem value="date-asc">Date (soonest)</SelectItem>
              <SelectItem value="date-desc">Date (latest)</SelectItem>
              <SelectItem value="location-asc">Location (A–Z)</SelectItem>
              <SelectItem value="location-desc">Location (Z–A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground">Visibility</span>
          <Select value={listedFilter} onValueChange={(v) => setListedFilter(v as ListedFilter)}>
            <SelectTrigger size="sm" className="w-full min-w-[min(100vw-2rem,180px)] sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="listed">Listed</SelectItem>
              <SelectItem value="invite_only">Invite only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredSorted.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead className="text-right">Cap</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Listed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSorted.map((game) => {
                  const court = typeof game.court === "string" ? game.court.trim() : "";
                  return (
                    <TableRow key={game.id}>
                      <TableCell className="whitespace-normal font-medium">
                        {formatGameDateLong(game.date)}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {formatGameTimeRangeLabel(game)}
                      </TableCell>
                      <TableCell className="max-w-[10rem] whitespace-normal lg:max-w-xs">
                        {game.location}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{court || "→"}</TableCell>
                      <TableCell className="text-right tabular-nums">{game.cap}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${Number(game.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {game.listed === false ? (
                          <Badge variant="outline">Invite only</Badge>
                        ) : (
                          <Badge variant="secondary">Listed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="icon-sm" className="shrink-0" asChild>
                            <Link
                              href={`/admin/games/${game.id}/edit`}
                              aria-label={`Edit game: ${game.location}`}
                            >
                              <Pencil />
                            </Link>
                          </Button>
                          <DeleteResourceDialog
                            action={deleteGameAction}
                            hiddenFields={{ id: game.id }}
                            resourceLabel="game"
                            resourceTitle={game.location}
                            triggerChildren={<Trash2 />}
                            triggerAriaLabel={`Delete game: ${game.location}`}
                            triggerSize="icon-sm"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className={cn("grid grid-cols-1 gap-4", "md:hidden")}>
            {filteredSorted.map((game) => (
              <AdminGameCard
                key={game.id}
                game={game}
                imageSrc={gameImageSrcById[game.id] ?? ""}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-w-0 space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as PhaseTab)} className="w-full">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="min-h-9 min-w-max gap-1">
            <TabsTrigger value="all" className="gap-1.5">
              All
              <TabCount n={counts.all} />
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="gap-1.5">
              Ongoing
              <TabCount n={counts.ongoing} />
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-1.5">
              Upcoming
              <TabCount n={counts.upcoming} />
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-1.5">
              Past
              <TabCount n={counts.past} />
            </TabsTrigger>
          </TabsList>
        </div>

        {(["all", "ongoing", "upcoming", "past"] as const).map((phase) => (
          <TabsContent key={phase} value={phase} className="mt-4 outline-none">
            {listPanel}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
