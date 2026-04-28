"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeagueSeason } from "@/server/actions/league-hosting";

type Props = { leagueId: string };

export function CreateLeagueSeasonForm({ leagueId }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        fd.set("league_id", leagueId);
        startTransition(async () => {
          const res = await createLeagueSeason(fd);
          setMessage(res.ok ? "Season created with default division and waiver." : res.error);
          if (res.ok) e.currentTarget.reset();
        });
      }}
    >
      <input type="hidden" name="league_id" value={leagueId} readOnly />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="season_slug">Season slug</Label>
          <Input id="season_slug" name="slug" required placeholder="spring" className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="season_name">Season name</Label>
          <Input id="season_name" name="name" required className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="season_desc">Description</Label>
          <Textarea id="season_desc" name="description" rows={2} className="rounded-lg" />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input id="listed" name="listed" type="checkbox" defaultChecked className="size-4" />
          <Label htmlFor="listed" className="font-normal">
            Listed publicly
          </Label>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="etransfer_instructions">E-transfer instructions (shown to players)</Label>
          <Textarea
            id="etransfer_instructions"
            name="etransfer_instructions"
            rows={4}
            placeholder="Send to … / memo format …"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="waiver_version_label">Waiver version label</Label>
          <Input
            id="waiver_version_label"
            name="waiver_version_label"
            required
            placeholder="2026-04-01"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="division_name">Default division name</Label>
          <Input id="division_name" name="division_name" defaultValue="Open" className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="waiver_body">Waiver body</Label>
          <Textarea id="waiver_body" name="waiver_body" required rows={10} className="rounded-lg font-mono text-xs" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} className="rounded-lg">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Create season
      </Button>
    </form>
  );
}
