import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";
import type { GameRow, SignupRow } from "@/types/domain";

export const listLiveGames = cache(async (): Promise<GameRow[]> => {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("status", "live")
      .order("starts_at", { ascending: true });
    return (data ?? []) as GameRow[];
  } catch {
    return [];
  }
});

/** Live games owned by the host (magic-link session email → `owner_email`). */
export const listLiveGamesForHost = cache(async (hostEmail: string): Promise<GameRow[]> => {
  const normalized = hostEmail.trim().toLowerCase();
  if (!normalized) return [];
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("status", "live")
      .ilike("owner_email", normalized)
      .order("starts_at", { ascending: true });
    return (data ?? []) as GameRow[];
  } catch {
    return [];
  }
});

/** Sign-ups grouped by `game_id` for the given games (active + waitlist only). */
export const getSignupsGroupedByGameId = cache(
  async (gameIds: string[]): Promise<Record<string, SignupRow[]>> => {
    if (gameIds.length === 0) return {};
    try {
      const supabase = createServerSupabase();
      const { data } = await supabase
        .from("signups")
        .select("*")
        .in("game_id", gameIds)
        .in("status", ["active", "waitlist"])
        .order("created_at", { ascending: true });
      const rows = (data ?? []) as SignupRow[];
      const record: Record<string, SignupRow[]> = {};
      for (const row of rows) {
        const list = record[row.game_id] ?? [];
        list.push(row);
        record[row.game_id] = list;
      }
      return record;
    } catch {
      return {};
    }
  }
);

export const getGameWithRoster = cache(
  async (id: string): Promise<{ game: GameRow; roster: SignupRow[] } | null> => {
    try {
      const supabase = createServerSupabase();
      const { data: game } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
      if (!game) return null;
      const { data: roster } = await supabase
        .from("signups")
        .select("*")
        .eq("game_id", id)
        .in("status", ["active", "waitlist"])
        .order("created_at", { ascending: true });
      return { game: game as GameRow, roster: (roster ?? []) as SignupRow[] };
    } catch {
      return null;
    }
  }
);
