'use server';

import { revalidatePath } from "next/cache";

import { isApprovedHostEmail } from "@/server/queries/hosts";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import { parseHostAccessRequest } from "@/types/schemas/host-access-request";

export type SubmitHostAccessRequestData = {
  duplicate: boolean;
  alreadyHost: boolean;
};

export async function submitHostAccessRequest(
  formData: FormData
): Promise<ActionResult<SubmitHostAccessRequestData>> {
  const parsed = parseHostAccessRequest(formData);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  if (await isApprovedHostEmail(parsed.data.email)) {
    return { ok: true, data: { duplicate: false, alreadyHost: true } };
  }

  const supabase = createServerSupabase();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .maybeSingle<{ id: string }>();
  if (!orgRow) {
    return { ok: false, error: "Pick a valid organization." };
  }

  if (parsed.data.contextGameId) {
    const { data: gameRow } = await supabase
      .from("games")
      .select("id")
      .eq("id", parsed.data.contextGameId)
      .eq("status", "live")
      .maybeSingle<{ id: string }>();
    if (!gameRow) {
      return { ok: false, error: "That game is not available for context." };
    }
  }

  const { data: pending } = await supabase
    .from("host_access_requests")
    .select("id")
    .eq("email", parsed.data.email)
    .eq("status", "pending")
    .maybeSingle<{ id: string }>();

  if (pending) {
    return { ok: true, data: { duplicate: true, alreadyHost: false } };
  }

  const { error } = await supabase.from("host_access_requests").insert({
    email: parsed.data.email,
    name: parsed.data.name,
    message: parsed.data.message ?? null,
    status: "pending",
    organization_id: parsed.data.organizationId,
    context_game_id: parsed.data.contextGameId ?? null,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Could not save your request." };
  }

  revalidatePath("/admin");
  return { ok: true, data: { duplicate: false, alreadyHost: false } };
}
