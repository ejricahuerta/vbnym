'use server';

import { revalidatePath } from "next/cache";

import { signupForGame } from "@/server/actions/signup";
import { getHostSessionEmail } from "@/lib/auth";
import { buildGmailConnectForPaymentSyncEmailTemplate } from "@/lib/email-templates";
import { isGameKindComingSoon } from "@/lib/game-kind-availability";
import { appOrigin } from "@/lib/env";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  parseHostInteracEmailFormData,
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

  const sessionEmail = await getHostSessionEmail();
  if (!sessionEmail) {
    return { ok: false, error: "Sign in as host to update payment details." };
  }

  const supabase = createServerSupabase();
  const normalizedSession = sessionEmail.trim().toLowerCase();
  const { data: row, error: fetchError } = await supabase
    .from("games")
    .select("id, owner_email, host_email")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; owner_email: string; host_email: string }>();

  if (fetchError || !row) {
    return { ok: false, error: "Game not found." };
  }

  if (row.owner_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only update games you host." };
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
    await sendTransactionalEmailResult({
      to: sessionEmail,
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
