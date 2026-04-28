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
  if (!parsed) {
    return { ok: false, error: "Enter your name and a valid email." };
  }

  if (await isApprovedHostEmail(parsed.email)) {
    return { ok: true, data: { duplicate: false, alreadyHost: true } };
  }

  const supabase = createServerSupabase();
  const { data: pending } = await supabase
    .from("host_access_requests")
    .select("id")
    .eq("email", parsed.email)
    .eq("status", "pending")
    .maybeSingle<{ id: string }>();

  if (pending) {
    return { ok: true, data: { duplicate: true, alreadyHost: false } };
  }

  const { error } = await supabase.from("host_access_requests").insert({
    email: parsed.email,
    name: parsed.name,
    message: parsed.message ?? null,
    status: "pending",
  });

  if (error) {
    return { ok: false, error: error.message ?? "Could not save your request." };
  }

  revalidatePath("/admin");
  return { ok: true, data: { duplicate: false, alreadyHost: false } };
}
