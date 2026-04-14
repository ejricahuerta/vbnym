import { describe, expect, it } from "vitest";
import {
  CANCELLATION_MIN_HOURS_BEFORE_GAME,
  gameRegionWallClockToUtcMs,
  gameStartUtcMs,
  isBeforeCancellationCutoff,
  todayIsoDateInGameScheduleZone,
} from "@/lib/registration-policy";

function torontoCalendarDateUtcMs(y: number, mo: number, d: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)));
  const yy = parts.find((p) => p.type === "year")?.value;
  const mm = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;
  if (!yy || !mm || !dd) throw new Error("format");
  return `${yy}-${mm}-${dd}`;
}

describe("todayIsoDateInGameScheduleZone", () => {
  it("returns YYYY-MM-DD aligned with America/Toronto calendar", () => {
    const ts = Date.UTC(2026, 0, 15, 10, 0, 0);
    expect(todayIsoDateInGameScheduleZone(ts)).toBe(torontoCalendarDateUtcMs(2026, 1, 15));
  });

  it("uses Toronto date near UTC midnight boundary", () => {
    const ts = Date.UTC(2026, 0, 15, 4, 30, 0);
    expect(todayIsoDateInGameScheduleZone(ts)).toBe(torontoCalendarDateUtcMs(2026, 1, 14));
  });
});

describe("gameStartUtcMs", () => {
  it("parses valid date + time into UTC ms", () => {
    const ms = gameStartUtcMs({ date: "2026-06-15", time: "6:00 PM" });
    expect(ms).not.toBeNull();
    const expected = gameRegionWallClockToUtcMs(2026, 6, 15, 18, 0);
    expect(ms).toBe(expected);
  });

  it("returns null for missing or invalid date", () => {
    expect(gameStartUtcMs({ date: "", time: "6:00 PM" })).toBeNull();
    expect(gameStartUtcMs({ date: "06-15-2026", time: "6:00 PM" })).toBeNull();
  });

  it("uses default start time when time string is empty (legacy rows)", () => {
    const ms = gameStartUtcMs({ date: "2026-06-15", time: "" });
    expect(ms).not.toBeNull();
    const withExplicit = gameStartUtcMs({ date: "2026-06-15", time: "7:00 PM" });
    expect(ms).toBe(withExplicit);
  });
});

describe("isBeforeCancellationCutoff", () => {
  const game = { date: "2030-01-01", time: "12:00 PM" };
  const start = gameStartUtcMs(game)!;
  const cutoff = start - CANCELLATION_MIN_HOURS_BEFORE_GAME * 3600000;

  it("returns true when more than 4h before start", () => {
    expect(isBeforeCancellationCutoff(game, cutoff - 3600000)).toBe(true);
  });

  it("returns false when less than 4h before start", () => {
    expect(isBeforeCancellationCutoff(game, cutoff + 3600000)).toBe(false);
  });

  it("returns false when date/time is unparseable", () => {
    expect(isBeforeCancellationCutoff({ date: "not-a-date", time: "12:00 PM" })).toBe(false);
  });
});

describe("gameRegionWallClockToUtcMs", () => {
  it("returns finite UTC ms across a spring-forward date in Toronto", () => {
    const ms = gameRegionWallClockToUtcMs(2025, 3, 9, 15, 0);
    expect(Number.isFinite(ms)).toBe(true);
  });

  it("maps wall clock to the same instant as a round trip through Toronto parts", () => {
    const ms = gameRegionWallClockToUtcMs(2026, 7, 4, 9, 30);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(ms));
    const y = Number(parts.find((p) => p.type === "year")?.value);
    const mo = Number(parts.find((p) => p.type === "month")?.value);
    const d = Number(parts.find((p) => p.type === "day")?.value);
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const mi = Number(parts.find((p) => p.type === "minute")?.value);
    expect({ y, mo, d, h, mi }).toEqual({ y: 2026, mo: 7, d: 4, h: 9, mi: 30 });
  });
});
