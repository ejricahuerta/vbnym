'use server';

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  buildHostSignupNotificationEmailTemplate,
  buildPlayerSignupPaymentEmailTemplate,
} from "@/lib/email-templates";
import { hostGmailConnectionId } from "@/lib/host-gmail";
import { PAYMENT_CODE_EXPIRY_MINUTES } from "@/lib/registration-policy";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { generatePaymentCode } from "@/lib/payment-code";
import { DEFAULT_ORGANIZATION_ID, DEFAULT_ORGANIZATION_NAME } from "@/lib/organization-default";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import { parseSignupFormData } from "@/types/schemas/signup";

export async function signupForGame(formData: FormData): Promise<ActionResult<{ signupId: string; paymentCode: string; waitlist: boolean }>> {
  const parsed = parseSignupFormData(formData);
  if (!parsed.ok) return parsed;

  const supabase = createServerSupabase();

  const [{ data: orgRow }, { data: game }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", DEFAULT_ORGANIZATION_ID).maybeSingle<{
      id: string;
      name: string;
    }>(),
    supabase
      .from("games")
      .select("id, title, starts_at, capacity, signed_count, waitlist_count, host_name, host_email, price_cents, organizations ( name )")
      .eq("id", parsed.data.gameId)
      .maybeSingle<{
        id: string;
        title: string;
        starts_at: string;
        capacity: number;
        signed_count: number;
        waitlist_count: number;
        host_name: string;
        host_email: string;
        price_cents: number;
        organizations: { name: string } | null;
      }>(),
  ]);

  if (!orgRow) {
    return { ok: false, error: "Default organization is missing. Contact support." };
  }
  if (!game) {
    return { ok: false, error: "Game not found." };
  }

  const gameOrganizerName = game.organizations?.name?.trim() || DEFAULT_ORGANIZATION_NAME;
  const playerOrganizationName = orgRow.name.trim();

  const signupId = randomUUID();
  const waitlist = game.signed_count >= game.capacity;
  const paymentCode = generatePaymentCode({
    gameId: parsed.data.gameId,
    signupId,
    playerEmail: parsed.data.playerEmail,
  });

  const { error } = await supabase.from("signups").insert({
    id: signupId,
    game_id: parsed.data.gameId,
    player_name: parsed.data.playerName,
    player_email: parsed.data.playerEmail,
    organization_id: DEFAULT_ORGANIZATION_ID,
    payment_code: paymentCode,
    payment_status: "pending",
    status: waitlist ? "waitlist" : "active",
  });
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("games")
    .update(
      waitlist
        ? { waitlist_count: game.waitlist_count + 1 }
        : { signed_count: game.signed_count + 1 }
    )
    .eq("id", parsed.data.gameId);

  const { data: syncConfig } = await supabase
    .from("game_email_sync_config")
    .select("preferred_gmail_connection_id")
    .eq("game_id", parsed.data.gameId)
    .maybeSingle<{ preferred_gmail_connection_id: string | null }>();
  const preferredConnectionId = syncConfig?.preferred_gmail_connection_id?.trim() ?? "";
  const hostConnectionId = hostGmailConnectionId(game.host_email);
  const candidateConnectionIds = [...new Set([preferredConnectionId, hostConnectionId].filter(Boolean))];
  let manualOnly = true;
  if (candidateConnectionIds.length > 0) {
    const { data: activeConnections } = await supabase
      .from("gmail_connections")
      .select("id")
      .in("id", candidateConnectionIds)
      .eq("active", true);
    manualOnly = (activeConnections?.length ?? 0) === 0;
  }

  const startsAtDisplay = new Date(game.starts_at).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const playerTemplate = buildPlayerSignupPaymentEmailTemplate({
    gameTitle: game.title,
    startsAtDisplay,
    gameOrganizerName,
    playerOrganizationName,
    hostName: game.host_name,
    hostEmail: game.host_email,
    playerName: parsed.data.playerName,
    paymentCode,
    amountCents: game.price_cents,
    deadlineMinutes: PAYMENT_CODE_EXPIRY_MINUTES,
    manualOnly,
  });
  const hostTemplate = buildHostSignupNotificationEmailTemplate({
    gameTitle: game.title,
    startsAtDisplay,
    gameOrganizerName,
    playerOrganizationName,
    playerName: parsed.data.playerName,
    playerEmail: parsed.data.playerEmail,
    paymentCode,
    amountCents: game.price_cents,
    manualOnly,
  });
  await Promise.all([
    sendTransactionalEmailResult({
      to: parsed.data.playerEmail,
      subject: playerTemplate.subject,
      html: playerTemplate.html,
      text: playerTemplate.text,
    }),
    sendTransactionalEmailResult({
      to: game.host_email,
      subject: hostTemplate.subject,
      html: hostTemplate.html,
      text: hostTemplate.text,
    }),
  ]);

  revalidatePath("/browse");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: { signupId, paymentCode, waitlist } };
}
