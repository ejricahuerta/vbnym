"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Mail, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { lookupGamesByEmail, type LookupResult } from "@/actions/lookup-games";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameCard } from "@/components/games/game-card";
import {
  getCookieConsent,
  saveGameId,
  setCookieConsent,
} from "@/lib/client/game-cookies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FindMyGamesDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  useEffect(() => setMounted(true), []);

  function resetState() {
    setEmail("");
    setResult(null);
    setSearched(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await lookupGamesByEmail(fd);
      setResult(res);
      setSearched(true);

      if (res.ok && res.games && res.games.length > 0) {
        if (getCookieConsent() !== "granted") {
          setCookieConsent("granted");
        }
        for (const g of res.games) {
          saveGameId(g.id);
        }
        router.refresh();
      }
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
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Find my games</DialogTitle>
          <DialogDescription>
            Enter the email you used to sign up and we&apos;ll find your
            upcoming games.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
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
              <Search className="size-4" aria-hidden />
            )}
            Find my games
          </Button>
        </form>

        {result?.error ? (
          <p className="text-sm text-destructive">{result.error}</p>
        ) : null}

        {searched && result?.ok && result.games?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming games found for this email. You may have used a
            different email to sign up.
          </p>
        ) : null}

        {result?.ok && result.games && result.games.length > 0 ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium text-foreground">
              Found {result.games.length} upcoming game
              {result.games.length === 1 ? "" : "s"} — saved to this browser
            </p>
            <ul className="flex flex-col gap-4">
              {result.games.map((g) => (
                <li key={g.id}>
                  <GameCard game={g} signups={g.signups} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
