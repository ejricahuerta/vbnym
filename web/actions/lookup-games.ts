"use server";

import { createClient } from "@/lib/supabase/server";
import type { Game, Signup } from "@/types/vbnym";
import { normalizeGame } from "@/lib/data/games";

export type LookupResult = {
  ok: boolean;
  error?: string;
  games?: (Game & { signups: Signup[] })[];
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isActiveSignup(s: Signup): boolean {
  if (s.paid) return true;
  if (!s.payment_code_expires_at) return true;
  const t = new Date(s.payment_code_expires_at).getTime();
  return !Number.isFinite(t) || t > Date.now();
}

export async function lookupGamesByEmail(
  formData: FormData
): Promise<LookupResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasSupabase) {
    return { ok: false, error: "Database not configured." };
  }

  try {
    const supabase = await createClient();
    const today = todayIsoDate();

    const { data: signups, error: signupsError } = await supabase
      .from("signups")
      .select("*")
      .eq("email", email);

    if (signupsError) {
      return { ok: false, error: "Could not look up your games." };
    }

    const activeSignups = ((signups ?? []) as Signup[]).filter(isActiveSignup);
    if (activeSignups.length === 0) {
      return { ok: true, games: [] };
    }

    const gameIds = [...new Set(activeSignups.map((s) => s.game_id))];
    const { data: gameRows, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .in("id", gameIds)
      .gte("date", today)
      .order("date", { ascending: true });

    if (gamesError) {
      return { ok: false, error: "Could not load game details." };
    }

    const allGameSignups: Record<string, Signup[]> = {};
    const upcomingGameIds = (gameRows ?? []).map((g: Game) => g.id);

    const { data: allSignupsForGames } = await supabase
      .from("signups")
      .select("*")
      .in("game_id", upcomingGameIds);

    for (const s of ((allSignupsForGames ?? []) as Signup[])) {
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

    return { ok: true, games };
  } catch {
    return { ok: false, error: "Could not look up your games." };
  }
}
