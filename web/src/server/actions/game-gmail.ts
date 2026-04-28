'use server';

import { revalidatePath } from "next/cache";

import { isAdminAuthorized } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";

export async function setGameGmailPreference(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const gameId = String(formData.get("gameId") ?? "").trim();
  const preferredConnectionId = String(formData.get("preferredConnectionId") ?? "").trim() || null;
  const useUniversalFallback = String(formData.get("useUniversalFallback") ?? "on") !== "off";
  if (!gameId) return { ok: false, error: "Missing game id." };

  const supabase = createServerSupabase();
  const { error } = await supabase.from("game_email_sync_config").upsert(
    {
      game_id: gameId,
      preferred_gmail_connection_id: preferredConnectionId,
      use_universal_fallback: useUniversalFallback,
    },
    { onConflict: "game_id" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: null };
}
