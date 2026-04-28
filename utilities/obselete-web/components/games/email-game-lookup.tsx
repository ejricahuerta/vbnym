"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { requestPlayerMagicLink } from "@/server/actions/request-player-magic-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PLAYER_MAGIC_LINK_TTL_MS,
  PLAYER_RECOVER_SESSION_MAX_AGE_SEC,
} from "@/lib/player-recover-cookie";
import { cn } from "@/lib/utils";

const LINK_MINUTES = Math.max(1, Math.round(PLAYER_MAGIC_LINK_TTL_MS / 60_000));
const SESSION_DAYS = Math.max(1, Math.round(PLAYER_RECOVER_SESSION_MAX_AGE_SEC / 86_400));

export function EmailGameLookup() {
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
      const res = await requestPlayerMagicLink(fd);
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
          Cleared your browser or lost &quot;My games&quot;? Enter your signup email and we will
          send a secure link. The link expires in about {LINK_MINUTES} minute
          {LINK_MINUTES === 1 ? "" : "s"}; after you open it, this device stays signed in for about{" "}
          {SESSION_DAYS} day{SESSION_DAYS === 1 ? "" : "s"}.
        </span>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="lookup-email" className="sr-only">
            Email
          </Label>
          <Input
            id="lookup-email"
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

      {sent && emailed === true ? (
        <div className="space-y-3">
          <p
            className={cn(
              "rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-foreground"
            )}
            role="status"
          >
            We sent a sign-in link to this address. Check your inbox and spam; it expires in about{" "}
            {LINK_MINUTES} minute{LINK_MINUTES === 1 ? "" : "s"}.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending || !email.includes("@")}
            onClick={() => {
              setSent(false);
              setEmailed(null);
              setError(null);
            }}
          >
            Email sign-in link again
          </Button>
        </div>
      ) : null}

      {sent && emailed === false ? (
        <p
          className={cn(
            "rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-foreground"
          )}
          role="status"
        >
          We did not send an email for this request. We only send links when this address matches an
          active signup for a listed upcoming game. Try the exact email you used to sign up, or
          contact the organizer if you need help.
        </p>
      ) : null}
    </div>
  );
}
