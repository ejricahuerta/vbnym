import type { Game, Signup } from "@/types/vbnym";
import { bookedHeadsForGame } from "@/types/vbnym";
import {
  gameTimeToTimeInputValue,
  parseGameTimeToParts,
  type TimeParts,
} from "@/lib/game-time-input";

/** Collapses whitespace and lowercases for comparing location vs address fields. */
export function normalizeVenueText(s: string | null | undefined): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** True when `address` is non-empty and not the same text as `location` (after normalize). */
export function hasDistinctGameAddress(
  location: string,
  address: string | null | undefined
): boolean {
  const a = typeof address === "string" ? address.trim() : "";
  if (!a) return false;
  return normalizeVenueText(location) !== normalizeVenueText(a);
}

/**
 * Full single line for clipboard: venue name plus street when a separate street exists.
 * Always the complete line (never only the street without the venue name).
 */
export function copyableVenueLineForClipboard(
  location: string,
  address: string | null | undefined
): string {
  const loc = location.trim();
  const addr = typeof address === "string" ? address.trim() : "";
  if (!addr) return loc;
  if (normalizeVenueText(loc) === normalizeVenueText(addr)) return loc;
  return `${loc}, ${addr}`;
}

function partsToMinutes(p: TimeParts): number {
  return p.hour * 60 + p.minute;
}

/** Single clock e.g. "7 PM" or "7:30 PM". */
export function formatGameClockLabel(parts: TimeParts): string {
  const d = new Date(2020, 0, 1, parts.hour, parts.minute);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: parts.minute !== 0 ? "2-digit" : undefined,
    hour12: true,
  });
}

function clockHourMinuteOnly(h: number, m: number): string {
  const d = new Date(2020, 0, 1, h, m);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: m !== 0 ? "2-digit" : undefined,
    hour12: true,
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value;
  return minute ? `${hour}:${minute}` : hour;
}

function dayPeriodLabel(h: number, m: number): string {
  const d = new Date(2020, 0, 1, h, m);
  return (
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true })
      .formatToParts(d)
      .find((p) => p.type === "dayPeriod")?.value ?? ""
  );
}

/**
 * Human range e.g. "7-10 PM", or a single start time if `end_time` is unset.
 * Unparseable legacy `time` is returned as stored.
 */
export function formatGameTimeRangeLabel(
  game: Pick<Game, "time" | "end_time">
): string {
  const startNorm = gameTimeToTimeInputValue(game.time);
  if (!startNorm) {
    const endRaw = game.end_time?.trim();
    if (endRaw && !gameTimeToTimeInputValue(endRaw)) {
      return `${String(game.time).trim()} - ${endRaw}`;
    }
    return String(game.time ?? "").trim();
  }

  const start = parseGameTimeToParts(game.time);
  const endRaw = game.end_time?.trim();
  const endNorm = endRaw ? gameTimeToTimeInputValue(endRaw) : "";
  if (!endNorm) {
    return formatGameClockLabel(start);
  }

  const end = parseGameTimeToParts(endRaw);
  const sm = partsToMinutes(start);
  const em = partsToMinutes(end);
  if (em <= sm) {
    return `${formatGameClockLabel(start)} - ${formatGameClockLabel(end)}`;
  }

  const p1 = dayPeriodLabel(start.hour, start.minute);
  const p2 = dayPeriodLabel(end.hour, end.minute);
  if (p1 === p2) {
    return `${clockHourMinuteOnly(start.hour, start.minute)}-${clockHourMinuteOnly(end.hour, end.minute)} ${p1}`;
  }
  return `${formatGameClockLabel(start)} - ${formatGameClockLabel(end)}`;
}

export function formatGameDateParts(dateStr: string): {
  dow: string;
  day: string;
  mon: string;
} {
  const d = new Date(`${dateStr}T12:00:00`);
  return {
    dow: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    day: String(d.getDate()),
    mon: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

/** Long label e.g. "Saturday, April 19, 2026" */
export function formatGameDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Public roster label e.g. "Alex C." from stored full name (never expose full surname). */
/** Shown when `game.court` is set, e.g. "Court: 3" or "Court: A". */
export function formatGameCourtLine(court: string | null | undefined): string | null {
  const t = typeof court === "string" ? court.trim() : "";
  return t ? `Court: ${t}` : null;
}

export function publicRosterName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const ch = last[0];
  if (!ch) return first;
  return `${first} ${ch.toUpperCase()}.`;
}

export function spotsLeft(game: Game, signups: Signup[]): number {
  return Math.max(0, game.cap - bookedHeadsForGame(signups));
}

export function progressPercent(game: Game, signups: Signup[]): number {
  if (game.cap <= 0) return 0;
  return Math.min(100, (bookedHeadsForGame(signups) / game.cap) * 100);
}

const ALMOST_FULL_THRESHOLD = 2;

export function isAlmostFull(game: Game, signups: Signup[]): boolean {
  const left = spotsLeft(game, signups);
  return left > 0 && left <= ALMOST_FULL_THRESHOLD;
}

export function registrationNotYetOpen(game: Game): boolean {
  if (!game.registration_opens_at) return false;
  const t = new Date(game.registration_opens_at).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export function daysUntilOpen(game: Game): number | null {
  if (!game.registration_opens_at) return null;
  const open = new Date(game.registration_opens_at);
  const now = new Date();
  const diff = open.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Build a Google Calendar "add event" URL from game fields.
 * Times are treated as local (America/Toronto).
 */
export function buildGoogleCalendarUrl(
  game: Pick<Game, "date" | "time" | "end_time" | "location" | "address">
): string {
  const start = parseGameTimeToParts(game.time);
  const end = game.end_time
    ? parseGameTimeToParts(game.end_time)
    : { hour: start.hour + 2, minute: start.minute };

  const datePart = game.date.replace(/-/g, "");
  const startStr = `${datePart}T${pad2(start.hour)}${pad2(start.minute)}00`;
  const endStr = `${datePart}T${pad2(end.hour)}${pad2(end.minute)}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Volleyball — ${game.location}`,
    dates: `${startStr}/${endStr}`,
    ctz: "America/Toronto",
    location: copyableVenueLineForClipboard(game.location, game.address),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
