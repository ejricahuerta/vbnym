import { afterEach, describe, expect, it } from "vitest";
import { normalizeGame } from "@/lib/normalize-game";
import { getUpcomingGamesWithSignups } from "@/server/queries/games";
import type { Game } from "@/types/vbnym";

describe("normalizeGame", () => {
  it("coerces date, price, listed default true", () => {
    const g = normalizeGame({
      id: "1",
      location: "Gym",
      address: null,
      lat: null,
      lng: null,
      date: "2026-08-01T00:00:00.000Z",
      time: "18:00",
      cap: 12,
      price: "15.5" as unknown as number,
      etransfer: "pay@test.com",
      listed: undefined,
    } as Game);
    expect(g.date).toBe("2026-08-01");
    expect(g.price).toBe(15.5);
    expect(g.listed).toBe(true);
  });

  it("handles null venue_id, end_time, court whitespace", () => {
    const g = normalizeGame({
      id: "1",
      location: "Gym",
      address: null,
      lat: "43.1" as unknown as number,
      lng: null,
      date: "2026-08-01",
      time: "18:00",
      cap: 12,
      price: 10,
      etransfer: "pay@test.com",
      venue_id: null,
      end_time: null,
      court: "  ",
    } as Game);
    expect(g.venue_id).toBeNull();
    expect(g.end_time).toBeNull();
    expect(g.court).toBeNull();
    expect(g.lat).toBe(43.1);
  });
});

describe("getUpcomingGamesWithSignups mock fallback", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("uses mock games when Supabase env missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await getUpcomingGamesWithSignups();
    expect(res.usingMock).toBe(true);
    expect(res.games.length).toBeGreaterThan(0);
    expect(res.fetchError).toBeNull();
  });
});
