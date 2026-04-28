import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { GameEmailSyncAdminView } from "@/types/game-email-sync";

export const getGameEmailSyncForAdmin = cache(
  async (gameId: string): Promise<GameEmailSyncAdminView> => {
    const supabase = await createClient();
    const { data: cfg } = await supabase
      .from("game_email_sync_config")
      .select("use_universal_fallback, preferred_gmail_connection_id")
      .eq("game_id", gameId)
      .maybeSingle<{
        use_universal_fallback: boolean | null;
        preferred_gmail_connection_id: string | null;
      }>();

    const useUniversalFallback = cfg?.use_universal_fallback !== false;
    const preferredId = cfg?.preferred_gmail_connection_id?.trim() ?? null;

    if (!preferredId) {
      return {
        use_universal_fallback: useUniversalFallback,
        preferred_gmail_connection_id: null,
        connected_email: null,
        reauth_required: false,
        gmail_assumed_expires_at: null,
      };
    }

    const { data: conn } = await supabase
      .from("gmail_connections")
      .select("gmail_connected_email, reauth_required, gmail_assumed_expires_at")
      .eq("id", preferredId)
      .maybeSingle<{
        gmail_connected_email: string | null;
        reauth_required: boolean | null;
        gmail_assumed_expires_at: string | null;
      }>();

    return {
      use_universal_fallback: useUniversalFallback,
      preferred_gmail_connection_id: preferredId,
      connected_email: conn?.gmail_connected_email ?? null,
      reauth_required: Boolean(conn?.reauth_required),
      gmail_assumed_expires_at: conn?.gmail_assumed_expires_at ?? null,
    };
  }
);
