import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";
import type { GameRow, SignupRow } from "@/types/domain";

export type PlayerSignupWithGame = {
  signup: SignupRow;
  game: GameRow;
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

/**
 * Live games at or after “now” where this email has any signup lifecycle state.
 * Uses the service-role client (see {@link createServerSupabase}).
 */
export const getPlayerSignupsWithUpcomingGamesByEmail = cache(
  async (email: string): Promise<PlayerSignupsByEmailResult> => {
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

      const { data: signups, error: signupsError } = await supabase
        .from("signups")
        .select("*, organizations ( name )")
        .eq("player_email", normalized);

      if (signupsError) {
        logQueryDiagnostic({
          stage: "signups_select",
          emailHashHint: hint,
          message: signupsError.message,
          code: signupsError.code,
        });
        return { rows: [], queryError: signupsError.message };
      }

      const signupRows = (signups ?? []) as SignupRow[];
      if (signupRows.length === 0) {
        return { rows: [], queryError: null };
      }

      const gameIds = [...new Set(signupRows.map((s) => s.game_id))];
      const { data: games, error: gamesError } = await supabase
        .from("games")
        .select("*, organizations ( name )")
        .in("id", gameIds)
        .eq("status", "live")
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true });

      if (gamesError) {
        logQueryDiagnostic({
          stage: "games_select",
          emailHashHint: hint,
          message: gamesError.message,
          code: gamesError.code,
        });
        return { rows: [], queryError: gamesError.message };
      }

      const gameById = new Map((games ?? []).map((g) => [g.id, g as GameRow]));
      const rows: PlayerSignupWithGame[] = [];

      for (const s of signupRows) {
        const g = gameById.get(s.game_id);
        if (g) {
          rows.push({ signup: s, game: g });
        }
      }

      rows.sort((a, b) => a.game.starts_at.localeCompare(b.game.starts_at));

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
);
