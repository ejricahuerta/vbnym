import "server-only";

import { createServerSupabase } from "@/lib/supabase-server";
import type { GameRow, SignupRow } from "@/types/domain";

type PlayerPortalSignup = Pick<SignupRow, "id" | "game_id" | "player_name" | "payment_code" | "payment_status" | "status">;
type PlayerPortalGame = Pick<GameRow, "id" | "title" | "venue_name" | "venue_area" | "starts_at" | "price_cents">;

export type PlayerSignupWithGame = {
  signup: PlayerPortalSignup;
  game: PlayerPortalGame;
};

export type PlayerSignupsByEmailResult = {
  rows: PlayerSignupWithGame[];
  /** Non-null when the database read failed (distinct from “no matching signups”). */
  queryError: string | null;
};

type QueryStage = "supabase_client_init" | "signups_select" | "games_select" | "unexpected";

type QueryDiagnostic = {
  stage: QueryStage;
  emailHashHint: string;
  message: string;
  code?: string;
};

function emailHashHint(email: string): string {
  let hash = 2166136261;
  for (let i = 0; i < email.length; i += 1) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `e${(hash >>> 0).toString(16)}`;
}

function logQueryDiagnostic(diag: QueryDiagnostic): void {
  console.error("[player-signups-by-email]", JSON.stringify(diag));
}

type PlayerSignupGameJoinRow = Pick<
  PlayerPortalSignup,
  "id" | "game_id" | "player_name" | "payment_code" | "payment_status" | "status"
> & {
  games: PlayerPortalGame | PlayerPortalGame[] | null;
};

/**
 * Live games at or after “now” where this email has any signup lifecycle state.
 * Uses the service-role client (see {@link createServerSupabase}).
 */
export async function getPlayerSignupsWithUpcomingGamesByEmail(email: string): Promise<PlayerSignupsByEmailResult> {
  const normalized = email.trim().toLowerCase();
  const hint = emailHashHint(normalized);
  if (!normalized || !normalized.includes("@")) {
    return { rows: [], queryError: null };
  }

  try {
    let supabase: ReturnType<typeof createServerSupabase>;
    try {
      supabase = createServerSupabase();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Supabase client init failed.";
      logQueryDiagnostic({
        stage: "supabase_client_init",
        emailHashHint: hint,
        message,
      });
      return { rows: [], queryError: message };
    }
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("signups")
      .select(
        "id, game_id, player_name, payment_code, payment_status, status, games!inner ( id, title, venue_name, venue_area, starts_at, price_cents )"
      )
      .eq("player_email", normalized)
      .eq("games.status", "live")
      .gte("games.starts_at", nowIso)
      .order("starts_at", { ascending: true, foreignTable: "games" });

    if (error) {
      logQueryDiagnostic({
        stage: "signups_select",
        emailHashHint: hint,
        message: error.message,
        code: error.code,
      });
      return { rows: [], queryError: error.message };
    }

    const rows = ((data ?? []) as unknown as PlayerSignupGameJoinRow[])
      .filter((row) => row.games)
      .map((row) => ({
        signup: {
          id: row.id,
          game_id: row.game_id,
          player_name: row.player_name,
          payment_code: row.payment_code,
          payment_status: row.payment_status,
          status: row.status,
        },
        game: (Array.isArray(row.games) ? row.games[0] : row.games) as PlayerPortalGame,
      }));

    return { rows, queryError: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Query failed.";
    logQueryDiagnostic({
      stage: "unexpected",
      emailHashHint: hint,
      message,
    });
    return { rows: [], queryError: message };
  }
}
