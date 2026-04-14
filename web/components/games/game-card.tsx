import Link from "next/link";
import { ArrowRight, CalendarPlus, Clock, DollarSign, MapPin, UserPlus, Users } from "lucide-react";
import type { Game, Signup } from "@/types/vbnym";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { ShareGameButton } from "@/components/games/share-game-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildGoogleCalendarUrl,
  copyableVenueLineForClipboard,
  formatGameCourtLine,
  formatGameDateParts,
  formatGameTimeRangeLabel,
  hasDistinctGameAddress,
  initialsFromName,
  progressPercent,
  spotsLeft,
  isAlmostFull,
  registrationNotYetOpen,
  daysUntilOpen,
} from "@/lib/game-display";

const ROSTER_PREVIEW_MAX = 6;

function OpenSlotBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-full border-dashed border-accent/50 bg-accent/5 font-normal text-accent-foreground"
    >
      <UserPlus className="size-3.5 shrink-0" aria-hidden />
      open
    </Badge>
  );
}

function SpotsBadge({ game, signups }: { game: Game; signups: Signup[] }) {
  const left = spotsLeft(game, signups);
  if (game.listed === false) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 rounded-full border-muted-foreground/50 text-muted-foreground"
      >
        Private
      </Badge>
    );
  }
  if (registrationNotYetOpen(game)) {
    const d = daysUntilOpen(game);
    return (
      <Badge
        variant="outline"
        className="shrink-0 rounded-full border-muted-foreground/60 text-muted-foreground"
      >
        {d != null && d > 0 ? `Opens in ${d}d` : "Opens soon"}
      </Badge>
    );
  }
  if (left <= 0) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 rounded-full border-muted-foreground/60 text-muted-foreground"
      >
        Full
      </Badge>
    );
  }
  if (isAlmostFull(game, signups)) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 rounded-full border-amber-600/60 text-amber-800 dark:text-amber-300"
      >
        Almost full
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="shrink-0 rounded-full border-accent/55 bg-accent/10 text-accent-foreground"
    >
      {left} left
    </Badge>
  );
}

export function GameCard({ game, signups }: { game: Game; signups: Signup[] }) {
  const date = formatGameDateParts(game.date);
  const left = spotsLeft(game, signups);
  const pct = progressPercent(game, signups);
  const booked = signups.reduce((s, x) => s + 1 + (x.friends?.length ?? 0), 0);
  const locked = game.listed === false || registrationNotYetOpen(game) || left <= 0;
  const openSlotsToShow = Math.min(left, 8);
  const courtLine = formatGameCourtLine(game.court);
  const previewSignups = signups.slice(0, ROSTER_PREVIEW_MAX);
  const rosterOverflow = signups.length - previewSignups.length;

  return (
    <Card
      className={`gap-0 overflow-hidden rounded-xl py-0 shadow-sm ring-1 ring-border/80 ${locked ? "opacity-75" : ""}`}
    >
      <div className="flex min-h-[140px]">
        <div className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center bg-primary px-2 py-4 text-center text-primary-foreground sm:w-[5.25rem]">
          <span className="text-[0.65rem] font-semibold leading-none tracking-wide opacity-90">
            {date.dow}
          </span>
          <span className="my-1 text-2xl font-bold leading-none tabular-nums sm:text-3xl">
            {date.day}
          </span>
          <span className="text-[0.65rem] font-semibold leading-none tracking-wide opacity-90">
            {date.mon}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 sm:gap-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-[0.9375rem] font-semibold leading-tight text-foreground sm:text-lg">
                {game.location}
              </h2>
              {courtLine ? (
                <p className="mt-0.5 text-xs font-medium text-accent">{courtLine}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <ShareGameButton
                gameId={game.id}
                gameTitle={game.location}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
              />
              <SpotsBadge game={game} signups={signups} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 shrink-0 text-accent" aria-hidden />
              {formatGameTimeRangeLabel(game)}
              <a
                href={buildGoogleCalendarUrl(game)}
                target="_blank"
                rel="noopener noreferrer"
                title="Add to Google Calendar"
                className="ml-0.5 inline-flex items-center rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent-foreground"
              >
                <CalendarPlus className="size-3.5" aria-hidden />
                <span className="sr-only">Add to calendar</span>
              </a>
            </span>
            <span className="inline-flex items-center gap-1">
              <DollarSign className="size-3.5 shrink-0" aria-hidden />$
              {Number(game.price).toFixed(0)}/person
            </span>
            {hasDistinctGameAddress(game.location, game.address) ? (
              <CopyTextButton
                text={copyableVenueLineForClipboard(game.location, game.address)}
                label="Copy address"
                variant="ghost"
                size="icon-xs"
                className="max-w-full translate-y-0.5 text-muted-foreground hover:text-foreground"
              >
                <span className="inline-flex min-w-0 items-baseline gap-1">
                  <MapPin className="size-3.5 shrink-0 translate-y-0.5" aria-hidden />
                  <span className="min-w-0 break-words">{game.address}</span>
                </span>
              </CopyTextButton>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Progress
              value={pct}
              className="h-1.5 flex-1 sm:h-2 [&_[data-slot=progress-indicator]]:bg-accent"
            />
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <Users className="size-3.5" aria-hidden />
              {booked}/{game.cap}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {signups.length === 0 ? (
                <p className="py-1 text-sm text-muted-foreground">Be the first to join.</p>
              ) : (
                <>
                  <div className="flex -space-x-1.5">
                    {previewSignups.map((s) => (
                      <Avatar key={s.id} className="size-7 border-2 border-card sm:size-8">
                        <AvatarFallback className="text-[0.6rem] sm:text-[0.65rem]">
                          {initialsFromName(s.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {signups.length} signed up
                    {rosterOverflow > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="ml-1 font-medium underline underline-offset-2 hover:text-foreground">
                            see all
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[min(85vh,32rem)] gap-4 sm:max-w-md" showCloseButton>
                          <DialogHeader>
                            <DialogTitle className="text-lg text-primary">Who&apos;s in</DialogTitle>
                            <DialogDescription>
                              {game.location} · {formatGameTimeRangeLabel(game)}
                              {courtLine ? ` · ${courtLine}` : ""}
                            </DialogDescription>
                          </DialogHeader>
                          <ul className="max-h-[min(55vh,22rem)] space-y-1 overflow-y-auto pr-1 text-sm text-foreground">
                            {signups.map((s) => (
                              <li
                                key={s.id}
                                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 last:border-0"
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Avatar className="size-8 shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {initialsFromName(s.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="min-w-0 font-medium">{s.name}</span>
                                </span>
                                {(s.friends?.length ?? 0) > 0 ? (
                                  <span className="text-xs text-muted-foreground">
                                    +{s.friends!.length} friend{s.friends!.length === 1 ? "" : "s"}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                          <Button className="gap-2 rounded-lg" asChild>
                            <Link href={`/games/${game.id}`}>
                              Game details
                              <ArrowRight className="size-4" aria-hidden />
                            </Link>
                          </Button>
                        </DialogContent>
                      </Dialog>
                    ) : null}
                  </span>
                </>
              )}
              {signups.length > 0 && left > 0 && openSlotsToShow <= 3
                ? Array.from({ length: openSlotsToShow }).map((_, i) => (
                    <OpenSlotBadge key={`open-${i}`} />
                  ))
                : null}
            </div>
          </div>

          {locked ? (
            <Button type="button" className="mt-0.5 w-full gap-2 rounded-xl" size="lg" disabled>
              <UserPlus className="size-4" aria-hidden />
              {game.listed === false
                ? "Invite only"
                : registrationNotYetOpen(game)
                  ? "Opens later"
                  : "Full — join waitlist"}
            </Button>
          ) : (
            <Button className="mt-0.5 w-full gap-2 rounded-xl" size="lg" asChild>
              <Link href={`/games/${game.id}`} className="inline-flex items-center justify-center gap-2">
                <UserPlus className="size-4" aria-hidden />
                Join game · ${Number(game.price).toFixed(0)}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
