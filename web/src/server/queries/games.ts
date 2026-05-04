import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";
import type { GameRow, SignupRow } from "@/types/domain";

const GAME_LIST_SELECT = [
  "id",
  "kind",
  "title",
  "venue_name",
  "venue_area",
  "starts_at",
  "duration_minutes",
  "skill_level",
  "capacity",
  "signed_count",
  "waitlist_count",
  "price_cents",
  "host_name",
  "host_email",
  "owner_email",
  "organization_id",
  "organizations ( name )",
  "notes",
  "status",
  "created_at",
].join(", ");

const ROSTER_SIGNUP_SELECT = [
  "id",
  "game_id",
  "signup_group_id",
  "player_name",
  "player_email",
  "added_by_name",
  "added_by_email",
  "refund_owner_name",
  "refund_owner_email",
  "is_primary_signup",
  "payment_code",
  "payment_status",
  "organization_id",
  "organizations ( name )",
  "status",
  "created_at",
].join(", ");

export const listLiveGames = cache(async (): Promise<GameRow[]> => {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("games")
      .select(GAME_LIST_SELECT)
      .eq("status", "live")
      .order("starts_at", { ascending: true });
    return (data ?? []) as unknown as GameRow[];
  } catch {
    return [];
  }
});

/** Live and cancelled games owned by the host (magic-link session email → `owner_email`). */
export async function listLiveGamesForHost(hostEmail: string): Promise<GameRow[]> {
  const normalized = hostEmail.trim().toLowerCase();
  if (!normalized) return [];
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("games")
      .select(GAME_LIST_SELECT)
      .in("status", ["live", "cancelled"])
      .ilike("owner_email", normalized)
      .order("starts_at", { ascending: true });
    return (data ?? []) as unknown as GameRow[];
  } catch {
    return [];
  }
}

/** Sign-ups grouped by `game_id` for the given games (active + waitlist only). */
export async function getSignupsGroupedByGameId(
  gameIds: string[],
  options?: { includeAllPaymentStatuses?: boolean }
): Promise<Record<string, SignupRow[]>> {
  if (gameIds.length === 0) return {};
  try {
    const supabase = createServerSupabase();
    const rosterStatuses = options?.includeAllPaymentStatuses ? ["active", "waitlist", "removed"] : ["active", "waitlist"];
    let query = supabase
      .from("signups")
      .select(ROSTER_SIGNUP_SELECT)
      .in("game_id", gameIds)
      .in("status", rosterStatuses)
      .order("created_at", { ascending: true });
    if (!options?.includeAllPaymentStatuses) {
      query = query.in("payment_status", ["pending", "paid"]);
    }
    const { data } = await query;
    const rows = (data ?? []) as unknown as SignupRow[];
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

export const getGameWithRoster = cache(
  async (id: string): Promise<{ game: GameRow; roster: SignupRow[] } | null> => {
    try {
      const supabase = createServerSupabase();
      const { data: game } = await supabase
        .from("games")
        .select(GAME_LIST_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (!game) return null;
      const { data: roster } = await supabase
        .from("signups")
        .select(ROSTER_SIGNUP_SELECT)
        .eq("game_id", id)
        .in("status", ["active", "waitlist"])
        .in("payment_status", ["pending", "paid"])
        .order("created_at", { ascending: true });
      return { game: game as unknown as GameRow, roster: (roster ?? []) as unknown as SignupRow[] };
    } catch {
      return null;
    }
  }
);

export type LiveGameSummaryForHostRequest = {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  venue_name: string;
  venue_area: string | null;
  organizations: { name: string } | { name: string }[] | null;
};

export const getLiveGameSummaryForHostRequest = cache(
  async (gameId: string): Promise<LiveGameSummaryForHostRequest | null> => {
    const trimmed = gameId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
      return null;
    }
    try {
      const supabase = createServerSupabase();
      const { data } = await supabase
        .from("games")
        .select("id, title, starts_at, duration_minutes, venue_name, venue_area, organizations ( name )")
        .eq("id", trimmed)
        .eq("status", "live")
        .maybeSingle();
      return (data ?? null) as LiveGameSummaryForHostRequest | null;
    } catch {
      return null;
    }
  }
);
