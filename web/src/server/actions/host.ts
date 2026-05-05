'use server';

import { revalidatePath } from "next/cache";

import { signupForGame } from "@/server/actions/signup";
import { getHostSessionEmail, resolveHostedGameManagement } from "@/lib/auth";
import { buildGmailConnectForPaymentSyncEmailTemplate } from "@/lib/email-templates";
import { isGameKindComingSoon } from "@/lib/game-kind-availability";
import { appOrigin } from "@/lib/env";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  parseHostCancelLiveGameFormData,
  parseHostInteracEmailFormData,
  parseHostLiveGameUpdateFormData,
  parseHostPublishFormData,
} from "@/types/schemas/host";
import type { ActionResult } from "@/types/action-result";

export async function publishHostGame(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseHostPublishFormData(formData);
  if (!parsed.ok) return parsed;
  if (isGameKindComingSoon(parsed.data.kind)) {
    return { ok: false, error: "League and Tournament are Coming Soon." };
  }

  const sessionEmail = await getHostSessionEmail();
  if (!sessionEmail) {
    return {
      ok: false,
      error: "Sign in with the magic link sent to your host email before publishing.",
    };
  }

  const supabase = createServerSupabase();

  const { data: orgExists } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .maybeSingle<{ id: string }>();
  if (!orgExists) {
    return { ok: false, error: "Pick a valid organization." };
  }

  const { data, error } = await supabase
    .from("games")
    .insert({
      kind: parsed.data.kind,
      title: parsed.data.title,
      venue_name: parsed.data.venueName,
      venue_area: parsed.data.venueArea || null,
      starts_at: parsed.data.startsAt,
      duration_minutes: parsed.data.durationMinutes,
      skill_level: parsed.data.skillLevel,
      capacity: parsed.data.capacity,
      signed_count: 0,
      waitlist_count: 0,
      price_cents: parsed.data.priceCents,
      host_name: parsed.data.hostName,
      host_email: parsed.data.hostEmail.trim(),
      host_whatsapp_e164: parsed.data.hostWhatsappE164,
      owner_email: sessionEmail,
      organization_id: parsed.data.organizationId,
      notes: parsed.data.format,
      status: "live",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not publish game." };
  }

  if (parsed.data.joinAsPlayer) {
    const signupFd = new FormData();
    signupFd.set("gameId", data.id);
    signupFd.set("playerName", parsed.data.hostName);
    signupFd.set("playerEmail", sessionEmail);
    const signupRes = await signupForGame(signupFd);
    if (!signupRes.ok) {
      await supabase.from("games").delete().eq("id", data.id);
      return { ok: false, error: signupRes.error };
    }
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${data.id}`);
  revalidatePath("/admin");
  return { ok: true, data: { id: data.id } };
}

export async function updateHostInteracEmail(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostInteracEmailFormData(formData);
  if (!parsed.ok) return parsed;

  const auth = await resolveHostedGameManagement();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const supabase = createServerSupabase();
  const { data: row, error: fetchError } = await supabase
    .from("games")
    .select("id, owner_email, host_email, status")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; owner_email: string; host_email: string; status: string }>();

  if (fetchError || !row) {
    return { ok: false, error: "Game not found." };
  }

  const isGameOwner =
    auth.hostSessionEmail != null &&
    row.owner_email.trim().toLowerCase() === auth.hostSessionEmail.trim().toLowerCase();
  if (!auth.isAdmin && !isGameOwner) {
    return { ok: false, error: "You can only update games you host." };
  }

  if (row.status !== "live") {
    return { ok: false, error: "Payment email can only be updated for live games." };
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({ host_email: parsed.data.hostEmail.trim() })
    .eq("id", parsed.data.gameId);

  if (updateError) {
    return { ok: false, error: updateError.message ?? "Could not update Interac email." };
  }

  const nextHostEmail = parsed.data.hostEmail.trim().toLowerCase();
  const previousHostEmail = row.host_email.trim().toLowerCase();
  if (nextHostEmail !== previousHostEmail) {
    const template = buildGmailConnectForPaymentSyncEmailTemplate({
      reconnectUrl: `${appOrigin()}/api/gmail/host/oauth/start`,
      reason: "payment_email_update",
    });
    const notifyEmail =
      isGameOwner && auth.hostSessionEmail ? auth.hostSessionEmail : row.owner_email.trim();
    await sendTransactionalEmailResult({
      to: notifyEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: null };
}

export async function updateHostLiveGameDetails(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostLiveGameUpdateFormData(formData);
  if (!parsed.ok) return parsed;

  const auth = await resolveHostedGameManagement();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const supabase = createServerSupabase();

  const { data: orgExists } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .maybeSingle<{ id: string }>();
  if (!orgExists) {
    return { ok: false, error: "Pick a valid organization." };
  }

  const { data: row, error: fetchError } = await supabase
    .from("games")
    .select("id, owner_email, signed_count, status")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; owner_email: string; signed_count: number; status: string }>();

  if (fetchError || !row) {
    return { ok: false, error: "Game not found." };
  }

  const isGameOwner =
    auth.hostSessionEmail != null &&
    row.owner_email.trim().toLowerCase() === auth.hostSessionEmail.trim().toLowerCase();
  if (!auth.isAdmin && !isGameOwner) {
    return { ok: false, error: "You can only update games you host." };
  }

  if (row.status !== "live") {
    return { ok: false, error: "Details can only be edited for live games." };
  }

  if (parsed.data.capacity < row.signed_count) {
    return {
      ok: false,
      error: `Capacity must be at least ${row.signed_count} (current roster size).`,
    };
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({
      title: parsed.data.title,
      venue_name: parsed.data.venueName,
      venue_area: parsed.data.venueArea?.trim() || null,
      starts_at: parsed.data.startsAt,
      duration_minutes: parsed.data.durationMinutes,
      skill_level: parsed.data.skillLevel,
      capacity: parsed.data.capacity,
      price_cents: parsed.data.priceCents,
      host_name: parsed.data.hostName,
      host_whatsapp_e164: parsed.data.hostWhatsappE164,
      organization_id: parsed.data.organizationId,
      notes: parsed.data.format,
    })
    .eq("id", parsed.data.gameId);

  if (updateError) {
    return { ok: false, error: updateError.message ?? "Could not update game details." };
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: null };
}

export async function cancelHostLiveGame(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostCancelLiveGameFormData(formData);
  if (!parsed.ok) return parsed;

  const auth = await resolveHostedGameManagement();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const supabase = createServerSupabase();

  const { data: row, error: fetchError } = await supabase
    .from("games")
    .select("id, owner_email, status")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; owner_email: string; status: string }>();

  if (fetchError || !row) {
    return { ok: false, error: "Game not found." };
  }

  const isGameOwner =
    auth.hostSessionEmail != null &&
    row.owner_email.trim().toLowerCase() === auth.hostSessionEmail.trim().toLowerCase();
  if (!auth.isAdmin && !isGameOwner) {
    return { ok: false, error: "You can only cancel games you host." };
  }

  if (row.status !== "live") {
    return { ok: false, error: "This game is not live, so it cannot be cancelled here." };
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.gameId)
    .eq("status", "live");

  if (updateError) {
    return { ok: false, error: updateError.message ?? "Could not cancel game." };
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: null };
}
