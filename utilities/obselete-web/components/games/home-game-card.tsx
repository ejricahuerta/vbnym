"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ALMOST_FULL_THRESHOLD = 2;

export type HomeGameRosterEntry = {
  id: string;
  label: string;
  extraFriends: number;
};

export function HomeGameCard({
  id,
  tag,
  time,
  day,
  title,
  courtLine,
  description,
  venue = null,
  price,
  booked,
  cap,
  spotsLeft,
  cta,
  full,
  rosterLine,
  rosterEntries,
  imageUrl,
}: {
  id: string;
  /** Short label e.g. "Drop-In Game" → shown as a small pill (suffix " Game" is trimmed for display). */
  tag: string;
  time: string;
  day: string;
  title: string;
  courtLine: string | null;
  description: string;
  /** Full street address when it adds information beyond `title` (location name). */
  venue?: string | null;
  price: number;
  booked: number;
  cap: number;
  spotsLeft: number;
  cta: string;
  full: boolean;
  rosterLine: string | null;
  rosterEntries: HomeGameRosterEntry[];
  imageUrl: string | null;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxImageHeightPx, setMaxImageHeightPx] = useState<number | undefined>(undefined);
  const hasRoster = rosterEntries.length > 0;
  const almostFull = !full && spotsLeft > 0 && spotsLeft <= ALMOST_FULL_THRESHOLD;
  const pct = cap > 0 ? Math.min(100, (booked / cap) * 100) : 0;
  const shortTag = tag.replace(/\s+Game$/i, "").trim() || tag;
  const timeCourt =
    courtLine && courtLine.trim()
      ? `${time}\u00A0\u00B7\u00A0${courtLine.trim()}`
      : time;

  useLayoutEffect(() => {
    if (!imageUrl) {
      return;
    }
    const el = contentRef.current;
    if (!el) return;

    function updateCap() {
      const node = contentRef.current;
      if (!node) return;
      const h = node.getBoundingClientRect().height;
      // Cap image at the text block height so the hero never towers over the details.
      setMaxImageHeightPx(Number.isFinite(h) && h > 0 ? h : undefined);
    }

    updateCap();
    const ro = new ResizeObserver(updateCap);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageUrl]);

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition duration-300 hover:border-primary/25 hover:shadow-md">
      {imageUrl ? (
        <div
          className="relative aspect-[10/3] w-full shrink-0 overflow-hidden bg-muted"
          style={
            maxImageHeightPx !== undefined ? { maxHeight: maxImageHeightPx } : undefined
          }
        >
          <img
            className="h-full w-full object-cover"
            src={imageUrl}
            alt={`${title}. Venue photo`}
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/25 to-black/10"
            aria-hidden
          />
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div ref={contentRef} className="flex min-h-0 flex-col">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-extrabold uppercase leading-snug tracking-wide text-primary">
              {day}
            </p>
            <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              {shortTag}
            </span>
          </div>

          <p className="mb-3 flex min-w-0 items-start gap-1.5 text-sm font-semibold text-primary">
            <Clock className="mt-0.5 size-4 shrink-0 text-accent opacity-90" aria-hidden />
            <span className="min-w-0">{timeCourt}</span>
          </p>

          <h3 className="mb-1.5 text-xl font-bold leading-tight tracking-tight text-primary sm:text-2xl">
            {title}
          </h3>

          {venue ? (
            <div className="mb-2 min-w-0">
              <CopyTextButton
                text={venue}
                label="Copy address"
                variant="ghost"
                size="icon-xs"
                className="max-w-full text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="inline-flex min-w-0 items-baseline gap-1.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" aria-hidden />
                  <span className="min-w-0 leading-snug">{venue}</span>
                </span>
              </CopyTextButton>
            </div>
          ) : null}

          {description.trim() ? (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{description.trim()}</p>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold text-primary">
              {Number.isFinite(price) ? `$${price.toFixed(0)}` : "→"}
              <span className="font-medium text-muted-foreground"> /person</span>
            </span>
            <span className="text-border" aria-hidden>
              ·
            </span>
            {full ? (
              <span className="text-xs font-bold uppercase tracking-wider text-destructive">
                Game full
              </span>
            ) : almostFull ? (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
              </span>
            )}
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Progress
              value={pct}
              className="h-2 flex-1 [&_[data-slot=progress-indicator]]:bg-primary"
            />
            <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" aria-hidden />
              {booked}/{cap}
            </span>
          </div>

          {hasRoster ? (
            <div className="mb-4 flex items-start gap-2">
              <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed text-muted-foreground">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span className="uppercase tracking-wide text-muted-foreground/80">Signed up</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                    {rosterEntries.length}
                  </span>
                </span>
                <span className="mt-1 block text-muted-foreground">{rosterLine ?? ""}</span>
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title={`See all players (${rosterEntries.length})`}
                    className="size-9 shrink-0 rounded-full border-primary/25 text-primary hover:bg-primary/5"
                  >
                    <Users className="size-4" aria-hidden />
                    <span className="sr-only">
                      See all players, {rosterEntries.length} signed up
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[min(85vh,32rem)] gap-4 sm:max-w-md" showCloseButton>
                  <DialogHeader>
                    <DialogTitle className="text-lg text-primary">Who&apos;s playing</DialogTitle>
                    <DialogDescription>
                      {title} · {day} · {time}
                      {courtLine ? ` · ${courtLine}` : ""}
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="max-h-[min(55vh,22rem)] space-y-2 overflow-y-auto pr-1 text-sm text-foreground">
                    {rosterEntries.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2 last:border-0"
                      >
                        <span className="font-medium">{row.label}</span>
                        {row.extraFriends > 0 ? (
                          <span className="text-xs text-slate-500">
                            +{row.extraFriends} friend{row.extraFriends === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href={`/app/games/${id}`}>Game details</Link>
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
        </div>

        <Link
          href={`/app/games/${id}`}
          className={
            full
              ? "mt-auto block w-full rounded-xl bg-muted py-3 text-center text-sm font-bold text-muted-foreground transition hover:bg-muted/80"
              : "mt-auto block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground transition hover:scale-[0.99] active:scale-[0.98]"
          }
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
