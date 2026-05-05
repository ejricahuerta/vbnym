'use server';

import { revalidatePath } from "next/cache";

import { isAdminAuthorized } from "@/lib/auth";
import { parseOptionalE164PhoneFromForm } from "@/lib/host-whatsapp";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import {
  addApprovedHostSchema,
  parseAddApprovedHost,
  parseApproveHostRequest,
  parseUpdateApprovedHost,
} from "@/types/schemas/host-admin";

export async function addApprovedHost(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseAddApprovedHost(formData);
  if (!parsed) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const phone = parseOptionalE164PhoneFromForm(parsed.hostPhone ?? "");
  if (!phone.ok) {
    return { ok: false, error: phone.error };
  }
  const localPart = parsed.email.split("@")[0]?.trim();
  const displayName =
    parsed.displayName?.trim() || (localPart && localPart.length >= 2 ? localPart : parsed.email);

  const supabase = createServerSupabase();
  const { error } = await supabase.from("approved_hosts").upsert(
    { email: parsed.email, display_name: displayName, phone_e164: phone.value },
    { onConflict: "email" }
  );

  if (error) {
    return { ok: false, error: error.message ?? "Could not add host." };
  }

  revalidatePath("/admin");
  return { ok: true, data: null };
}

export async function updateApprovedHost(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseUpdateApprovedHost(formData);
  if (!parsed) {
    return { ok: false, error: "Check name (at least 2 characters), email, and phone format." };
  }

  const phone = parseOptionalE164PhoneFromForm(parsed.hostPhone);
  if (!phone.ok) {
    return { ok: false, error: phone.error };
  }

  const supabase = createServerSupabase();
  const current = parsed.currentEmail.trim().toLowerCase();
  const next = parsed.newEmail.trim().toLowerCase();

  const { data: row, error: fetchError } = await supabase
    .from("approved_hosts")
    .select("email")
    .eq("email", current)
    .maybeSingle<{ email: string }>();

  if (fetchError || !row) {
    return { ok: false, error: "Host not found. Refresh the page and try again." };
  }

  if (current !== next) {
    const { data: conflict, error: conflictErr } = await supabase
      .from("approved_hosts")
      .select("email")
      .eq("email", next)
      .maybeSingle<{ email: string }>();

    if (conflictErr) {
      return { ok: false, error: conflictErr.message ?? "Could not verify email." };
    }
    if (conflict) {
      return { ok: false, error: "That email is already on the approved list. Remove or edit the other row first." };
    }
  }

  const { error: updErr } = await supabase
    .from("approved_hosts")
    .update({
      email: next,
      display_name: parsed.displayName.trim(),
      phone_e164: phone.value,
    })
    .eq("email", current);

  if (updErr) {
    return { ok: false, error: updErr.message ?? "Could not update host." };
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
    .select("id, email, name, status")
    .eq("id", parsed.requestId)
    .maybeSingle<{ id: string; email: string; name: string; status: string }>();

  if (fetchError || !row || row.status !== "pending") {
    return { ok: false, error: "Request not found or already handled." };
  }

  const email = addApprovedHostSchema.safeParse({ email: row.email.trim().toLowerCase() });
  if (!email.success) {
    return { ok: false, error: "Request has an invalid email." };
  }

  const { error: hostErr } = await supabase.from("approved_hosts").upsert(
    { email: email.data.email, display_name: row.name.trim(), phone_e164: null },
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
