import Link from "next/link";
import { ArrowRight, CalendarPlus, Clock, MapPin, UserPlus } from "lucide-react";
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
import { cn } from "@/lib/utils";

const ROSTER_PREVIEW_TOP = 3;

/** Fixed column on sm+ — room for 3 avatars + +n + share, progress and Join aligned. */
const gameCardCtaWidthClass = "w-full min-w-0 sm:w-[11rem]";

function SpotsBadge({ game, signups }: { game: Game; signups: Signup[] }) {
  const left = spotsLeft(game, signups);
  const pillClass =
    "shrink-0 rounded-full border-accent/55 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent-foreground";
  if (game.listed === false) {
    return (
      <Badge variant="outline" className={cn(pillClass, "border-muted-foreground/50 text-muted-foreground")}>
        Private
      </Badge>
    );
  }
  if (registrationNotYetOpen(game)) {
    const d = daysUntilOpen(game);
    return (
      <Badge variant="outline" className={cn(pillClass, "border-muted-foreground/60 text-muted-foreground")}>
        {d != null && d > 0 ? `Opens in ${d}d` : "Opens soon"}
      </Badge>
    );
  }
  if (left <= 0) {
    return (
      <Badge variant="outline" className={cn(pillClass, "border-muted-foreground/60 text-muted-foreground")}>
        Full
      </Badge>
    );
  }
  if (isAlmostFull(game, signups)) {
    return (
      <Badge variant="outline" className={cn(pillClass, "border-amber-600/55 text-amber-800 dark:text-amber-300")}>
        {left} spot{left === 1 ? "" : "s"} left
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={pillClass}>
      {left} spot{left === 1 ? "" : "s"} open
    </Badge>
  );
}

export function GameCard({
  game,
  signups,
  ctaLabel,
  isSignedUp = false,
}: {
  game: Game;
  signups: Signup[];
  ctaLabel?: string;
  isSignedUp?: boolean;
}) {
  const date = formatGameDateParts(game.date);
  const left = spotsLeft(game, signups);
  const pct = progressPercent(game, signups);
  const booked = signups.reduce((s, x) => s + 1 + (x.friends?.length ?? 0), 0);
  const locked = game.listed === false || registrationNotYetOpen(game) || left <= 0;
  const almostFull = isAlmostFull(game, signups);
  const courtLine = formatGameCourtLine(game.court);
  const previewSignups = signups.slice(0, ROSTER_PREVIEW_TOP);
  /** Headcount beyond the primary initials we show (friends + signups past the preview). */
  const playerOverflowCount = Math.max(0, booked - previewSignups.length);

  const accentStripe = locked
    ? "bg-muted-foreground/50"
    : almostFull
      ? "bg-amber-500"
      : "bg-accent";

  const lockedLabel =
    game.listed === false
      ? "Invite only"
      : registrationNotYetOpen(game)
        ? "Opens later"
        : "Full — join waitlist";

  const locationPinLine = hasDistinctGameAddress(game.location, game.address)
    ? game.address
    : null;

  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden rounded-xl border border-accent/35 py-0 shadow-sm ring-0",
        locked && "opacity-80"
      )}
    >
      <div className="flex min-h-[7.5rem] items-stretch">
        {/* Date rail — accent stripe + day / DOW */}
        <div
          className={cn(
            "relative flex w-[4.25rem] shrink-0 flex-col sm:w-[4.75rem] md:w-[14%] md:max-w-[6.5rem]",
            "border-r border-border/80 bg-muted/25 dark:bg-primary/10"
          )}
        >
          <div className={cn("absolute inset-y-0 left-0 w-1", accentStripe)} aria-hidden />
          <div className="flex flex-1 flex-col items-center justify-center py-3 pl-3.5 pr-2 text-center sm:py-4 sm:pl-4">
            <span className="text-2xl font-bold leading-none tabular-nums text-foreground sm:text-[1.65rem]">
              {date.day}
            </span>
            <span className="mt-1 text-[0.65rem] font-semibold leading-none tracking-widest text-muted-foreground">
              {date.dow}
            </span>
          </div>
        </div>

        {/* Body — sm+: main block and CTA row are side-by-side, vertically centered */}
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-4"
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:min-w-0">
            {/* Availability — mobile: share upper-right of badge; sm+: share lives with roster row */}
            <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <SpotsBadge game={game} signups={signups} />
                {signups.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground sm:text-xs">Be the first to join.</p>
                ) : null}
              </div>
              <ShareGameButton
                gameId={game.id}
                gameTitle={game.location}
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground sm:hidden"
              />
            </div>

            {/* Title + court / time / address — tight stack */}
            <div className="flex min-w-0 flex-col gap-0">
              <h2 className="text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg md:text-xl">
                {game.location}
              </h2>
              <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground sm:text-sm">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  {courtLine ? (
                    <span className="inline-flex max-w-full shrink-0 items-center gap-1.5 text-xs font-semibold text-accent sm:text-sm">
                      <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span className="min-w-0 truncate">{courtLine}</span>
                    </span>
                  ) : null}
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0 text-accent sm:size-4" aria-hidden />
                    <span className="min-w-0">{formatGameTimeRangeLabel(game)}</span>
                    <a
                      href={buildGoogleCalendarUrl(game)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Add to Google Calendar"
                      className="inline-flex shrink-0 items-center rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent-foreground"
                    >
                      <CalendarPlus className="size-3.5 sm:size-4" />
                      <span className="sr-only">Add to calendar</span>
                    </a>
                  </span>
                </div>
                {locationPinLine ? (
                  <CopyTextButton
                    text={copyableVenueLineForClipboard(game.location, game.address)}
                    label="Copy address"
                    variant="ghost"
                    size="icon-xs"
                    className="h-auto max-w-full justify-start p-0 text-left text-muted-foreground hover:text-foreground"
                  >
                    <span className="inline-flex min-w-0 items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 sm:size-4" aria-hidden />
                      <span className="min-w-0 leading-snug">{locationPinLine}</span>
                    </span>
                  </CopyTextButton>
                ) : null}
              </div>
            </div>
          </div>

          {/* Roster + progress + CTA */}
          <div className={cn("mt-auto flex shrink-0 flex-col gap-2 sm:mt-0", gameCardCtaWidthClass)}>
            {signups.length > 0 ? (
              <>
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center">
                    <div className="flex shrink-0 -space-x-2">
                      {previewSignups.map((s) => (
                        <Avatar key={s.id} className="size-7 border-2 border-card sm:size-8">
                          <AvatarFallback className="bg-primary text-[0.6rem] text-primary-foreground sm:text-[0.65rem]">
                            {initialsFromName(s.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {playerOverflowCount > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Avatar
                              className="z-[1] size-7 cursor-pointer border-2 border-card sm:size-8"
                              aria-label={`${playerOverflowCount} more players — open roster`}
                            >
                              <AvatarFallback className="bg-muted text-[0.6rem] font-bold text-muted-foreground sm:text-[0.65rem]">
                                +{playerOverflowCount}
                              </AvatarFallback>
                            </Avatar>
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
                                    <AvatarFallback className="text-xs">{initialsFromName(s.name)}</AvatarFallback>
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
                            <Link href={`/app/games/${game.id}`}>
                              Game details
                              <ArrowRight className="size-4" aria-hidden />
                            </Link>
                          </Button>
                        </DialogContent>
                        </Dialog>
                      ) : null}
                    </div>
                  </div>
                  <ShareGameButton
                    gameId={game.id}
                    gameTitle={game.location}
                    variant="ghost"
                    size="icon-sm"
                    className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:inline-flex"
                  />
                </div>
                <div className="flex w-full flex-col gap-1">
                  <span className="text-end text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs">
                    {booked} / {game.cap}
                  </span>
                  <Progress
                    value={pct}
                    className="h-1 w-full min-w-0 sm:h-1.5 [&_[data-slot=progress-indicator]]:bg-accent"
                  />
                </div>
              </>
            ) : (
              <div className="hidden w-full justify-end sm:flex">
                <ShareGameButton
                  gameId={game.id}
                  gameTitle={game.location}
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                />
              </div>
            )}
            {isSignedUp ? (
              <Button
                size="lg"
                className="w-full gap-2 rounded-lg bg-primary font-bold text-primary-foreground shadow-none hover:bg-primary/90"
                asChild
              >
                <Link href={`/app/games/${game.id}`} className="inline-flex items-center justify-center gap-2">
                  See details
                </Link>
              </Button>
            ) : locked ? (
              <Button type="button" size="lg" disabled className="w-full gap-2 rounded-lg">
                <UserPlus className="size-4" aria-hidden />
                {lockedLabel}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full gap-2 rounded-lg bg-accent font-bold text-accent-foreground shadow-none hover:bg-accent/90"
                asChild
              >
                <Link href={`/app/games/${game.id}`} className="inline-flex items-center justify-center gap-2">
                  <UserPlus className="size-4" aria-hidden />
                  {ctaLabel ?? `Join — $${Number(game.price).toFixed(0)}`}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
