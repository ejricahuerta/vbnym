"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import type { Game, Signup } from "@/types/vbnym";
import { GameCard } from "@/components/games/game-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearPlayerRecoverSession } from "@/server/actions/clear-player-recover-session";
import { clearPlayerBrowserData } from "@/lib/client/game-cookies";

export function MyGamesClient({
  games,
  signupsByGameId,
  savedGameIds,
}: {
  games: Game[];
  signupsByGameId: Record<string, Signup[]>;
  savedGameIds: string[];
}) {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saved = useMemo(
    () => games.filter((g) => savedGameIds.includes(g.id)),
    [games, savedGameIds]
  );

  async function onClearSaved() {
    clearPlayerBrowserData();
    await clearPlayerRecoverSession();
    setCleared(true);
    setConfirmOpen(false);
    router.refresh();
  }

  if (saved.length === 0) {
    return (
      <Card className="gap-0 overflow-hidden rounded-xl border border-accent/35 shadow-sm">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent sm:size-16">
            <CalendarDays className="size-7 sm:size-8" aria-hidden />
          </div>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
            No upcoming games
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Sign up for a game and it will show up here with your payment details and roster info.
          </p>
          <Button asChild className="mt-6 rounded-xl" size="lg">
            <Link href="/app">Browse games</Link>
          </Button>
          {savedGameIds.length > 0 && !cleared ? (
            <p className="mt-5 max-w-xs text-xs text-muted-foreground">
              Past games don&apos;t appear here. Only upcoming ones will show.
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="flex flex-col gap-3">
        {saved.map((g) => (
          <li key={g.id}>
            <GameCard
              game={g}
              signups={signupsByGameId[g.id] ?? []}
              ctaLabel="See details"
            />
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-muted-foreground">
        <button
          type="button"
          className="underline underline-offset-4 hover:text-foreground"
          onClick={() => setConfirmOpen(true)}
        >
          Clear saved games from this browser
        </button>
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Clear saved games?</DialogTitle>
            <DialogDescription>
              This removes locally saved games and your email sign-in session from this browser.
              It does not cancel any sign-ups you already made.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="rounded-xl" onClick={onClearSaved}>
              Clear saved games
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
