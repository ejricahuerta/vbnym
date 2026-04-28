import type { Game } from "@/types/vbnym";
import { gameTimeToTimeInputValue, parseGameTimeToParts } from "@/lib/game-time-input";

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

/** Default run length when `end_time` is missing (matches calendar export behavior). */
const DEFAULT_GAME_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Scheduled game end as UTC ms, or null if start cannot be resolved.
 * Uses `end_time` on `game.date` when parseable and strictly after start; otherwise start + 2h.
 */
export function gameEndUtcMs(game: Pick<Game, "date" | "time" | "end_time">): number | null {
  const start = gameStartUtcMs(game);
  if (start == null) return null;
  const raw = game.date?.trim();
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;

  const endRaw = game.end_time?.trim();
  if (!endRaw || !gameTimeToTimeInputValue(endRaw)) {
    return start + DEFAULT_GAME_DURATION_MS;
  }

  const { hour: endHour, minute: endMinute } = parseGameTimeToParts(endRaw);
  const endMs = gameRegionWallClockToUtcMs(y, mo, d, endHour, endMinute);
  if (!Number.isFinite(endMs) || endMs <= start) {
    return start + DEFAULT_GAME_DURATION_MS;
  }
  return endMs;
}

export type AdminGameSchedulePhase = "ongoing" | "upcoming" | "past";

/**
 * Buckets a game for the admin games list using Toronto wall times.
 * When start/end cannot be computed, falls back to calendar `date` vs today in {@link GAME_SCHEDULE_TIMEZONE}.
 */
export function getAdminGameSchedulePhase(
  game: Pick<Game, "date" | "time" | "end_time">,
  nowMs: number = Date.now()
): AdminGameSchedulePhase {
  const start = gameStartUtcMs(game);
  const end = gameEndUtcMs(game);
  if (start != null && end != null) {
    if (nowMs < start) return "upcoming";
    if (nowMs < end) return "ongoing";
    return "past";
  }

  const today = todayIsoDateInGameScheduleZone(nowMs);
  const d = game.date?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "upcoming";
  if (d < today) return "past";
  return "upcoming";
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
