import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";

export type GameEmailSyncState = {
  connected: boolean;
  useUniversalFallback: boolean;
  preferredConnectionId: string | null;
};

export const getGameEmailSyncState = cache(async (gameId: string): Promise<GameEmailSyncState> => {
  const supabase = createServerSupabase();
  const [{ data: cfg }, { data: conn }] = await Promise.all([
    supabase
      .from("game_email_sync_config")
      .select("preferred_gmail_connection_id, use_universal_fallback")
      .eq("game_id", gameId)
      .maybeSingle<{ preferred_gmail_connection_id: string | null; use_universal_fallback: boolean }>(),
    supabase.from("gmail_connections").select("id").eq("id", "universal").maybeSingle<{ id: string }>(),
  ]);
  return {
    connected: Boolean(conn?.id),
    useUniversalFallback: cfg?.use_universal_fallback ?? true,
    preferredConnectionId: cfg?.preferred_gmail_connection_id ?? null,
  };
});
