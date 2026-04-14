import "server-only";

import { createClient } from "@/lib/supabase/server";
import { normalizeGame } from "@/lib/data/games";
import type { Game, Signup } from "@/types/vbnym";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isActiveSignup(s: Signup): boolean {
  if (s.paid) return true;
  if (!s.payment_code_expires_at) return true;
  const t = new Date(s.payment_code_expires_at).getTime();
  return !Number.isFinite(t) || t > Date.now();
}

/**
 * Upcoming listed games where this email has an active signup, with full signups per game.
 */
export async function getPlayerUpcomingGamesByEmail(
  email: string
): Promise<(Game & { signups: Signup[] })[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return [];
  }

  const supabase = await createClient();
  const today = todayIsoDate();

  const { data: signups, error: signupsError } = await supabase
    .from("signups")
    .select("*")
    .eq("email", normalized);

  if (signupsError) {
    return [];
  }

  const activeSignups = ((signups ?? []) as Signup[]).filter(isActiveSignup);
  if (activeSignups.length === 0) {
    return [];
  }

  const gameIds = [...new Set(activeSignups.map((s) => s.game_id))];
  const { data: gameRows, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .in("id", gameIds)
    .gte("date", today)
    .order("date", { ascending: true });

  if (gamesError) {
    return [];
  }

  const allGameSignups: Record<string, Signup[]> = {};
  const upcomingGameIds = (gameRows ?? []).map((g: Game) => g.id);

  const { data: allSignupsForGames } = await supabase
    .from("signups")
    .select("*")
    .in("game_id", upcomingGameIds);

  for (const s of (allSignupsForGames ?? []) as Signup[]) {
    if (!isActiveSignup(s)) continue;
    allGameSignups[s.game_id] ??= [];
    allGameSignups[s.game_id].push(s);
  }

  return ((gameRows ?? []) as Game[])
    .map(normalizeGame)
    .filter((g) => g.listed !== false)
    .map((g) => ({
      ...g,
      signups: allGameSignups[g.id] ?? [],
    }));
}
