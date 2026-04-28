"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { registerCaptainTeam } from "@/server/actions/league-registration";

type DivisionOpt = { id: string; name: string };

type Props = {
  leagueSlug: string;
  seasonSlug: string;
  seasonId: string;
  divisions: DivisionOpt[];
  waiverVersionLabel: string;
  waiverBodyPreview: string;
};

export function LeagueRegisterTeamForm({
  leagueSlug,
  seasonSlug,
  seasonId,
  divisions,
  waiverVersionLabel,
  waiverBodyPreview,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [divisionId, setDivisionId] = useState(divisions[0]?.id ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("season_id", seasonId);
    fd.set("division_id", divisionId);
    startTransition(async () => {
      const res = await registerCaptainTeam(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      form.reset();
    });
  }

  return (
    <form className="space-y-6 rounded-xl border bg-card p-6 shadow-sm" onSubmit={onSubmit}>
      <input type="hidden" name="season_id" value={seasonId} readOnly />
      <input type="hidden" name="division_id" value={divisionId} readOnly />
      <div className="space-y-2">
        <Label>Division</Label>
        <Select value={divisionId} onValueChange={setDivisionId} required>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Choose division" />
          </SelectTrigger>
          <SelectContent>
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="team_name">Team name</Label>
          <Input id="team_name" name="team_name" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="captain_name">Captain name</Label>
          <Input id="captain_name" name="captain_name" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="captain_email">Captain email</Label>
          <Input
            id="captain_email"
            name="captain_email"
            type="email"
            required
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="roster_emails">Player emails (optional)</Label>
        <Textarea
          id="roster_emails"
          name="roster_emails"
          placeholder="One per line, or comma-separated"
          rows={5}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll email each player an invite link. Don&apos;t include the captain again.
        </p>
      </div>
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Waiver summary ({waiverVersionLabel})
        </p>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-foreground">
          {waiverBodyPreview}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Full text is shown on each player&apos;s invite. By checking below, the captain confirms
          they accept the waiver for themselves as captain.
        </p>
      </div>
      <div className="flex items-start gap-3">
        <input
          id="terms_accepted"
          name="terms_accepted"
          type="checkbox"
          required
          className="mt-1 size-4 rounded border border-input"
        />
        <Label htmlFor="terms_accepted" className="text-sm font-normal leading-snug">
          I accept the league waiver version <strong>{waiverVersionLabel}</strong> and terms for
          myself as captain.
        </Label>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Team registered. Check email for confirmation; your players receive invites.
        </p>
      ) : null}
      <Button type="submit" className="rounded-xl" disabled={pending || !divisionId}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit registration
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href={`/leagues/${leagueSlug}/${seasonSlug}`} className="underline">
          Cancel
        </Link>
      </p>
    </form>
  );
}
