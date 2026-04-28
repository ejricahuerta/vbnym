"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptLeagueInvite } from "@/server/actions/league-invite-accept";

type Props = {
  token: string;
  waiverVersionLabel: string;
};

export function LeagueInviteAcceptForm({ token, waiverVersionLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setRefCode(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("token", token);
    startTransition(async () => {
      const res = await acceptLeagueInvite(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRefCode(res.data.referenceCode);
    });
  }

  return (
    <form className="space-y-6 rounded-xl border bg-card p-6 shadow-sm" onSubmit={onSubmit}>
      <input type="hidden" name="token" value={token} readOnly />
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required className="rounded-xl" autoComplete="name" />
      </div>
      <div className="flex items-start gap-3">
        <input
          id="waiver_accepted"
          name="waiver_accepted"
          type="checkbox"
          required
          className="mt-1 size-4 rounded border border-input"
        />
        <Label htmlFor="waiver_accepted" className="text-sm font-normal leading-snug">
          I have read and accept the waiver <strong>{waiverVersionLabel}</strong> for this season.
        </Label>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {refCode ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          You&apos;re on the roster. Check your email for e-transfer instructions. Reference:{" "}
          <strong>{refCode}</strong>
        </p>
      ) : null}
      <Button type="submit" className="rounded-xl" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Accept and continue
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/app/league-team" className="underline">
          Open team portal after you sign in
        </Link>
      </p>
    </form>
  );
}
