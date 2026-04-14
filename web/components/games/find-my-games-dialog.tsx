"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { requestPlayerMagicLink } from "@/actions/request-player-magic-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PLAYER_MAGIC_LINK_TTL_MS,
  PLAYER_RECOVER_SESSION_MAX_AGE_SEC,
} from "@/lib/player-recover-cookie";
import { cn } from "@/lib/utils";

const LINK_MINUTES = Math.max(1, Math.round(PLAYER_MAGIC_LINK_TTL_MS / 60_000));
const SESSION_DAYS = Math.max(1, Math.round(PLAYER_RECOVER_SESSION_MAX_AGE_SEC / 86_400));

export function FindMyGamesDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydration gate: render trigger-only on server/first paint to avoid Radix id mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only gate for Dialog
    setMounted(true);
  }, []);

  function resetState() {
    setEmail("");
    setSent(false);
    setError(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSent(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestPlayerMagicLink(fd);
      if (!res.ok && res.error) {
        setError(res.error);
        return;
      }
      setSent(true);
    });
  }

  if (!mounted) return <>{children}</>;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Find my games</DialogTitle>
          <DialogDescription>
            Enter the email you used to sign up. We will email you a sign-in link. The link expires
            in about {LINK_MINUTES} minute{LINK_MINUTES === 1 ? "" : "s"}; after you open it, your
            browser stays signed in for about {SESSION_DAYS} day{SESSION_DAYS === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="find-games-email" className="sr-only">
              Email
            </Label>
            <Input
              id="find-games-email"
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
            Email sign-in link
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
              "rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-foreground"
            )}
            role="status"
          >
            If that address has an upcoming game with us, check your inbox. If you do not see it,
            check spam. You can close this dialog and open the link when it arrives.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
