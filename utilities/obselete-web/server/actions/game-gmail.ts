"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";

export async function disconnectGameGmail(
  gameId: string
): Promise<ActionResult<null>> {
  const id = gameId.trim();
  if (!id) return { ok: false, error: "Missing game id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const { data: cfg, error: cfgErr } = await supabase
    .from("game_email_sync_config")
    .select("preferred_gmail_connection_id")
    .eq("game_id", id)
    .maybeSingle<{ preferred_gmail_connection_id: string | null }>();

  if (cfgErr) return { ok: false, error: cfgErr.message };

  const connId = cfg?.preferred_gmail_connection_id?.trim();
  if (!connId) {
    return { ok: true, data: null };
  }

  const { error: upErr } = await supabase
    .from("game_email_sync_config")
    .update({ preferred_gmail_connection_id: null })
    .eq("game_id", id);
  if (upErr) return { ok: false, error: upErr.message };

  const { error: delErr } = await supabase.from("gmail_connections").delete().eq("id", connId);
  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath(`/admin/games/${id}/edit`);
  revalidatePath("/admin/games");
  return { ok: true, data: null };
}
