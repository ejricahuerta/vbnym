import type { Game } from "@/types/vbnym";
import { parseGameTimeToParts } from "@/lib/game-time-input";

/** Wall clock for interpreting `game.date` + `game.time`. */
export const GAME_SCHEDULE_TIMEZONE = "America/Toronto";

export const GAME_SCHEDULE_TIMEZONE_LABEL = "Toronto (Eastern Time)";

/** `YYYY-MM-DD` for “today” in {@link GAME_SCHEDULE_TIMEZONE} (compare to `games.date`). */
export function todayIsoDateInGameScheduleZone(nowMs: number = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GAME_SCHEDULE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(nowMs));
  const y = parts.find((p) => p.type === "year")?.value;
  const mo = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !mo || !d) return new Date(nowMs).toISOString().slice(0, 10);
  return `${y}-${mo}-${d}`;
}

/** Payment code validity for new signups and for waitlist invite holds. */
export const PAYMENT_CODE_EXPIRY_MINUTES = 15;

/** Waitlist invite: time to complete payment for a released spot (same window as payment code). */
export const WAITLIST_INVITE_MINUTES = PAYMENT_CODE_EXPIRY_MINUTES;

/** Minimum lead time before scheduled start to cancel under policy. */
export const CANCELLATION_MIN_HOURS_BEFORE_GAME = 4;

function formatTorontoParts(utcMs: number): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GAME_SCHEDULE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcMs));
}

function readZoned(parts: Intl.DateTimeFormatPart[]) {
  const n = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value ?? NaN);
  return {
    y: n("year"),
    mo: n("month"),
    d: n("day"),
    h: n("hour"),
    mi: n("minute"),
  };
}

function dayNumber(y: number, mo: number, d: number): number {
  return Math.floor(Date.UTC(y, mo - 1, d) / 86400000);
}

/**
 * UTC epoch ms for the instant when clocks in {@link GAME_SCHEDULE_TIMEZONE}
 * read `y-mo-d` at `hour:minute`.
 */
export function gameRegionWallClockToUtcMs(
  y: number,
  mo: number,
  d: number,
  hour: number,
  minute: number
): number {
  let t = Date.UTC(y, mo - 1, d, hour, minute, 0);
  const targetDay = dayNumber(y, mo, d);
  for (let i = 0; i < 48; i++) {
    const p = readZoned(formatTorontoParts(t));
    if (!Number.isFinite(p.y)) return NaN;
    const gotDay = dayNumber(p.y, p.mo, p.d);
    if (gotDay !== targetDay) {
      t += (targetDay - gotDay) * 86400000;
      continue;
    }
    if (p.h === hour && p.mi === minute) return t;
    t += ((hour - p.h) * 60 + (minute - p.mi)) * 60000;
  }
  return NaN;
}

/** Scheduled game start as UTC ms, or null if the game row cannot be interpreted. */
export function gameStartUtcMs(game: Pick<Game, "date" | "time">): number | null {
  const raw = game.date?.trim();
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;
  const { hour, minute } = parseGameTimeToParts(game.time);
  const ms = gameRegionWallClockToUtcMs(y, mo, d, hour, minute);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * True if `now` is still before the policy cutoff (full `CANCELLATION_MIN_HOURS_BEFORE_GAME`
 * hours before listed start). Used when enforcing or explaining cancellation windows.
 */
export function isBeforeCancellationCutoff(
  game: Pick<Game, "date" | "time">,
  nowMs: number = Date.now()
): boolean {
  const start = gameStartUtcMs(game);
  if (start == null) return false;
  const cutoff = start - CANCELLATION_MIN_HOURS_BEFORE_GAME * 3600000;
  return nowMs < cutoff;
}
