"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LEAGUE_PORTAL_MAGIC_LINK_TTL_MS,
  LEAGUE_PORTAL_SESSION_MAX_AGE_SEC,
} from "@/lib/league-portal-cookie";
import { cn } from "@/lib/utils";
import { requestLeaguePortalMagicLink } from "@/server/actions/request-league-portal-magic-link";

const LINK_MINUTES = Math.max(1, Math.round(LEAGUE_PORTAL_MAGIC_LINK_TTL_MS / 60_000));
const SESSION_DAYS = Math.max(1, Math.round(LEAGUE_PORTAL_SESSION_MAX_AGE_SEC / 86_400));

export function LeaguePortalLoginForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [emailed, setEmailed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setEmailed(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestLeaguePortalMagicLink(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent(true);
      setEmailed(res.emailed);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="size-4 shrink-0" aria-hidden />
        <span>
          Enter the email on your league roster. We&apos;ll send a magic link that expires in about{" "}
          {LINK_MINUTES} minute{LINK_MINUTES === 1 ? "" : "s"}; after you open it, this device stays signed
          in for about {SESSION_DAYS} day{SESSION_DAYS === 1 ? "" : "s"}.
        </span>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="league-portal-email" className="sr-only">
            Email
          </Label>
          <Input
            id="league-portal-email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            className="rounded-xl bg-muted/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="gap-2 rounded-xl"
          disabled={pending || !email.includes("@")}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Mail className="size-4" aria-hidden />
          )}
          Email me a sign-in link
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p
          className={cn(
            "text-sm",
            emailed ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
          )}
        >
          {emailed
            ? "Check your inbox for the sign-in link."
            : "If that email is on a league roster, we sent a sign-in link. If you don’t see it, check spam or try again."}
        </p>
      ) : null}
    </div>
  );
}
