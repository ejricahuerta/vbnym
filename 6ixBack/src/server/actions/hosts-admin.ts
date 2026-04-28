'use server';

import { revalidatePath } from "next/cache";

import { isAdminAuthorized } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import {
  addApprovedHostSchema,
  parseAddApprovedHost,
  parseApproveHostRequest,
} from "@/types/schemas/host-admin";

export async function addApprovedHost(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseAddApprovedHost(formData);
  if (!parsed) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.from("approved_hosts").upsert(
    { email: parsed.email },
    { onConflict: "email" }
  );

  if (error) {
    return { ok: false, error: error.message ?? "Could not add host." };
  }

  revalidatePath("/admin");
  return { ok: true, data: null };
}

export async function removeApprovedHost(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseAddApprovedHost(formData);
  if (!parsed) {
    return { ok: false, error: "Invalid email." };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.from("approved_hosts").delete().eq("email", parsed.email);
  if (error) {
    return { ok: false, error: error.message ?? "Could not remove host." };
  }

  revalidatePath("/admin");
  return { ok: true, data: null };
}

export async function approveHostAccessRequest(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseApproveHostRequest(formData);
  if (!parsed) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = createServerSupabase();
  const { data: row, error: fetchError } = await supabase
    .from("host_access_requests")
    .select("id, email, status")
    .eq("id", parsed.requestId)
    .maybeSingle<{ id: string; email: string; status: string }>();

  if (fetchError || !row || row.status !== "pending") {
    return { ok: false, error: "Request not found or already handled." };
  }

  const email = addApprovedHostSchema.safeParse({ email: row.email.trim().toLowerCase() });
  if (!email.success) {
    return { ok: false, error: "Request has an invalid email." };
  }

  const { error: hostErr } = await supabase.from("approved_hosts").upsert(
    { email: email.data.email },
    { onConflict: "email" }
  );
  if (hostErr) {
    return { ok: false, error: hostErr.message ?? "Could not approve host." };
  }

  const { error: updErr } = await supabase
    .from("host_access_requests")
    .update({ status: "approved" })
    .eq("id", row.id);

  if (updErr) {
    return { ok: false, error: updErr.message ?? "Could not update request." };
  }

  revalidatePath("/admin");
  return { ok: true, data: null };
}
