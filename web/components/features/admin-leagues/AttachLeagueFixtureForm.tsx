"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { attachLeagueFixture } from "@/server/actions/league-hosting";
import type { Game } from "@/types/vbnym";
import type { LeagueTeamOptionRow } from "@/server/queries/admin-leagues";

type Props = {
  seasonId: string;
  games: Game[];
  teams: LeagueTeamOptionRow[];
};

export function AttachLeagueFixtureForm({ seasonId, games, teams }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        fd.set("season_id", seasonId);
        startTransition(async () => {
          const res = await attachLeagueFixture(fd);
          setMessage(res.ok ? "Fixture linked." : res.error);
        });
      }}
    >
      <input type="hidden" name="season_id" value={seasonId} readOnly />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="game_id">Game</Label>
          <select
            id="game_id"
            name="game_id"
            required
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a game</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.date} {g.time} → {g.location}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="home_team_id">Home team (optional)</Label>
          <select
            id="home_team_id"
            name="home_team_id"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">→</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="away_team_id">Away team (optional)</Label>
          <select
            id="away_team_id"
            name="away_team_id"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">→</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="round_number">Round #</Label>
          <input
            id="round_number"
            name="round_number"
            type="number"
            min={0}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="matchday">Matchday #</Label>
          <input
            id="matchday"
            name="matchday"
            type="number"
            min={0}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} size="sm" className="rounded-lg">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Link game to season
      </Button>
    </form>
  );
}
