import "server-only";

import { cache } from "react";

import { todayIsoDateInCalendarTz } from "@/lib/calendar-today";
import { normalizeGame } from "@/lib/normalize-game";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Game, Signup } from "@/types/vbnym";

/**
 * Player email lookups run from server actions and route handlers where the anon
 * cookie client can see zero rows under RLS/session; service role avoids that.
 * Falls back to the SSR anon client when the service key is not set (e.g. some local setups).
 */
async function createPlayerEmailLookupClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createAdminClient();
  }
  return createClient();
}

export type PlayerUpcomingGamesByEmailResult = {
  games: (Game & { signups: Signup[] })[];
  /** Non-null when a Supabase read failed (not the same as “no matching games”). */
  queryError: string | null;
};

function isActiveSignup(s: Signup): boolean {
  if (s.paid) return true;
  if (!s.payment_code_expires_at) return true;
  const t = new Date(s.payment_code_expires_at).getTime();
  return !Number.isFinite(t) || t > Date.now();
}

/**
 * Upcoming listed games where this email has an active signup, with full signups per game.
 */
export const getPlayerUpcomingGamesByEmail = cache(
  async (email: string): Promise<PlayerUpcomingGamesByEmailResult> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      return { games: [], queryError: null };
    }

    const supabase = await createPlayerEmailLookupClient();
    const today = todayIsoDateInCalendarTz();

    const { data: signups, error: signupsError } = await supabase
      .from("signups")
      .select("*")
      .eq("email", normalized);

    if (signupsError) {
      return { games: [], queryError: signupsError.message };
    }

    const activeSignups = ((signups ?? []) as Signup[]).filter(isActiveSignup);
    if (activeSignups.length === 0) {
      return { games: [], queryError: null };
    }

    const gameIds = [...new Set(activeSignups.map((s) => s.game_id))];
    const { data: gameRows, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .in("id", gameIds)
      .gte("date", today)
      .order("date", { ascending: true });

    if (gamesError) {
      return { games: [], queryError: gamesError.message };
    }

    const allGameSignups: Record<string, Signup[]> = {};
    const upcomingGameIds = (gameRows ?? []).map((g: Game) => g.id);
    if (upcomingGameIds.length === 0) {
      return { games: [], queryError: null };
    }

    const { data: allSignupsForGames } = await supabase
      .from("signups")
      .select("*")
      .in("game_id", upcomingGameIds);

    for (const s of (allSignupsForGames ?? []) as Signup[]) {
      if (!isActiveSignup(s)) continue;
      allGameSignups[s.game_id] ??= [];
      allGameSignups[s.game_id].push(s);
    }

    const games = ((gameRows ?? []) as Game[])
      .map(normalizeGame)
      .filter((g) => g.listed !== false)
      .map((g) => ({
        ...g,
        signups: allGameSignups[g.id] ?? [],
      }));

    return { games, queryError: null };
  }
);
