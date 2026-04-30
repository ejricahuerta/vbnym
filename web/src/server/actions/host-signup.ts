'use server';

import { revalidatePath } from "next/cache";

import { getHostSessionEmail } from "@/lib/auth";
import {
  buildPlayerPaymentConfirmedEmailTemplate,
  buildPlayerSignupPaymentEmailTemplate,
} from "@/lib/email-templates";
import { appOrigin } from "@/lib/env";
import { hostGmailConnectionId } from "@/lib/host-gmail";
import { DEFAULT_ORGANIZATION_NAME } from "@/lib/organization-default";
import { PAYMENT_CODE_EXPIRY_MINUTES } from "@/lib/registration-policy";
import { createPlayerCancelSignupLinkToken } from "@/lib/magic-link";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import {
  parseHostSetSignupPaymentStatusFormData,
  parseHostSetSignupRosterStatusFormData,
} from "@/types/schemas/host-signup";

export async function setSignupPaymentStatusForHost(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostSetSignupPaymentStatusFormData(formData);
  if (!parsed.ok) return parsed;

  const sessionEmail = await getHostSessionEmail();
  if (!sessionEmail) {
    return { ok: false, error: "Sign in as host to update the roster." };
  }

  const supabase = createServerSupabase();
  const normalizedSession = sessionEmail.trim().toLowerCase();

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select(
      "id, title, starts_at, host_name, host_email, price_cents, owner_email, signed_count, waitlist_count, capacity, organizations ( name )"
    )
    .eq("id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      title: string;
      starts_at: string;
      host_name: string;
      host_email: string;
      price_cents: number;
      owner_email: string;
      signed_count: number;
      waitlist_count: number;
      capacity: number;
      organizations: { name: string } | { name: string }[] | null;
    }>();

  if (gameErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  if (game.owner_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only update games you host." };
  }

  const { data: signup } = await supabase
    .from("signups")
    .select("id, player_name, player_email, payment_status, status, payment_code, organizations ( name )")
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      player_name: string;
      player_email: string;
      payment_status: "paid" | "pending" | "refund" | "canceled";
      status: "active" | "waitlist" | "removed" | "deleted";
      payment_code: string;
      organizations: { name: string } | { name: string }[] | null;
    }>();

  if (!signup) {
    return { ok: false, error: "Sign-up not found." };
  }

  const nextPaymentStatus = parsed.data.paymentStatus;
  const shouldAutoCancelRoster =
    (nextPaymentStatus === "refund" || nextPaymentStatus === "canceled") &&
    (signup.status === "active" || signup.status === "waitlist");

  /** After refund/canceled payment, roster was set to `removed` and counts were decremented. Restoring payment must put the row back on active or waitlist or it matches neither host table. */
  const shouldRestoreRosterFromArchivedPayment =
    (signup.payment_status === "refund" || signup.payment_status === "canceled") &&
    (nextPaymentStatus === "paid" || nextPaymentStatus === "pending") &&
    signup.status === "removed";

  const restoredRosterStatus: "active" | "waitlist" | null = shouldRestoreRosterFromArchivedPayment
    ? game.signed_count < game.capacity
      ? "active"
      : "waitlist"
    : null;

  const nextRosterStatus = shouldAutoCancelRoster
    ? "removed"
    : restoredRosterStatus ?? signup.status;

  const updatePayload: {
    payment_status: "paid" | "pending" | "refund" | "canceled";
    status?: "removed" | "active" | "waitlist";
  } = {
    payment_status: nextPaymentStatus,
  };
  if (shouldAutoCancelRoster) {
    updatePayload.status = "removed";
  } else if (restoredRosterStatus) {
    updatePayload.status = restoredRosterStatus;
  }

  const { error: upErr } = await supabase
    .from("signups")
    .update(updatePayload)
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId);

  if (upErr) {
    return { ok: false, error: upErr.message ?? "Could not update payment status." };
  }

  if (shouldAutoCancelRoster) {
    if (signup.status === "active") {
      await supabase
        .from("games")
        .update({ signed_count: Math.max(0, game.signed_count - 1) })
        .eq("id", parsed.data.gameId);
    } else if (signup.status === "waitlist") {
      await supabase
        .from("games")
        .update({ waitlist_count: Math.max(0, game.waitlist_count - 1) })
        .eq("id", parsed.data.gameId);
    }
  } else if (restoredRosterStatus) {
    if (restoredRosterStatus === "active") {
      await supabase
        .from("games")
        .update({ signed_count: game.signed_count + 1 })
        .eq("id", parsed.data.gameId);
    } else {
      await supabase
        .from("games")
        .update({ waitlist_count: game.waitlist_count + 1 })
        .eq("id", parsed.data.gameId);
    }
  }

  const becamePaid =
    nextPaymentStatus === "paid" && signup?.payment_status !== "paid" && nextRosterStatus !== "deleted";
  if (becamePaid && signup) {
    const cancelExpiryMs = Date.parse(game.starts_at) - 2 * 60 * 60 * 1000;
    const canCancel = Number.isFinite(cancelExpiryMs) && cancelExpiryMs > Date.now();
    const cancelToken = canCancel
      ? createPlayerCancelSignupLinkToken({
          gameId: game.id,
          signupId: signup.id,
          playerEmail: signup.player_email,
          expiresAtMs: cancelExpiryMs,
        })
      : null;
    const startsAtDisplay = new Date(game.starts_at).toLocaleString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const template = buildPlayerPaymentConfirmedEmailTemplate({
      gameTitle: game.title,
      startsAtDisplay,
      playerName: signup.player_name,
      hostName: game.host_name,
      hostEmail: game.host_email,
      amountCents: game.price_cents,
      sourceLabel: "the host",
      canCancel: Boolean(cancelToken),
      cancellationUrl: cancelToken ? `${appOrigin().replace(/\/$/, "")}/api/signup/cancel?t=${encodeURIComponent(cancelToken)}` : null,
    });
    await sendTransactionalEmailResult({
      to: signup.player_email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  const becamePending =
    nextPaymentStatus === "pending" && signup.payment_status !== "pending" && nextRosterStatus !== "deleted";
  if (becamePending && signup) {
    const hostConnectionId = hostGmailConnectionId(game.host_email);
    const { data: hostConnection } = await supabase
      .from("gmail_connections")
      .select("id")
      .eq("id", hostConnectionId)
      .eq("active", true)
      .maybeSingle<{ id: string }>();
    const manualOnly = !hostConnection;

    const presenterOrg = Array.isArray(game.organizations) ? game.organizations[0] : game.organizations;
    const gameOrganizerName = presenterOrg?.name?.trim() || DEFAULT_ORGANIZATION_NAME;
    const playerOrg = Array.isArray(signup.organizations) ? signup.organizations[0] : signup.organizations;
    const playerOrganizationName = playerOrg?.name?.trim() || DEFAULT_ORGANIZATION_NAME;

    const startsAtDisplay = new Date(game.starts_at).toLocaleString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const pendingTemplate = buildPlayerSignupPaymentEmailTemplate({
      gameTitle: game.title,
      startsAtDisplay,
      gameOrganizerName,
      playerOrganizationName,
      hostName: game.host_name,
      hostEmail: game.host_email,
      playerName: signup.player_name,
      paymentCode: signup.payment_code,
      amountCents: game.price_cents,
      deadlineMinutes: PAYMENT_CODE_EXPIRY_MINUTES,
      manualOnly,
    });
    await sendTransactionalEmailResult({
      to: signup.player_email,
      subject: pendingTemplate.subject,
      html: pendingTemplate.html,
      text: pendingTemplate.text,
    });
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  revalidatePath("/player");
  return { ok: true, data: null };
}

export async function setSignupRosterStatusForHost(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostSetSignupRosterStatusFormData(formData);
  if (!parsed.ok) return parsed;

  const sessionEmail = await getHostSessionEmail();
  if (!sessionEmail) {
    return { ok: false, error: "Sign in as host to update the roster." };
  }

  const supabase = createServerSupabase();
  const normalizedSession = sessionEmail.trim().toLowerCase();
  const nextStatus = parsed.data.status;

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, owner_email, capacity, signed_count, waitlist_count")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      owner_email: string;
      capacity: number;
      signed_count: number;
      waitlist_count: number;
    }>();

  if (gameErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  if (game.owner_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only update games you host." };
  }

  const { data: signup, error: signupErr } = await supabase
    .from("signups")
    .select("id, status, payment_status")
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      status: "active" | "waitlist" | "removed" | "deleted";
      payment_status: "paid" | "pending" | "refund" | "canceled";
    }>();

  if (signupErr || !signup) {
    return { ok: false, error: "Sign-up not found." };
  }

  const from = signup.status;
  if (from === nextStatus) {
    return { ok: true, data: null };
  }

  if (nextStatus === "removed" && !["refund", "canceled"].includes(signup.payment_status)) {
    return { ok: false, error: "You can remove players only after refund is in progress or completed." };
  }

  if (nextStatus === "deleted" && !["refund", "canceled"].includes(signup.payment_status)) {
    return { ok: false, error: "You can permanently delete only after refund is in progress or completed." };
  }

  if (from === "deleted") {
    return { ok: false, error: "This signup is already permanently deleted." };
  }

  let signedCount = game.signed_count;
  let waitlistCount = game.waitlist_count;

  if (from === "active") {
    if (nextStatus === "waitlist") {
      signedCount -= 1;
      waitlistCount += 1;
    } else if (nextStatus === "removed" || nextStatus === "deleted") {
      signedCount -= 1;
    }
  } else if (from === "waitlist") {
    if (nextStatus === "active") {
      if (signedCount >= game.capacity) {
        return {
          ok: false,
          error: "Roster is full. Open a spot before promoting from the waitlist.",
        };
      }
      waitlistCount -= 1;
      signedCount += 1;
    } else if (nextStatus === "removed" || nextStatus === "deleted") {
      waitlistCount -= 1;
    }
  }

  const { error: signupUpdateErr } = await supabase
    .from("signups")
    .update({ status: nextStatus })
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId);

  if (signupUpdateErr) {
    return { ok: false, error: signupUpdateErr.message ?? "Could not update roster status." };
  }

  const { error: gameUpdateErr } = await supabase
    .from("games")
    .update({ signed_count: signedCount, waitlist_count: waitlistCount })
    .eq("id", parsed.data.gameId);

  if (gameUpdateErr) {
    return { ok: false, error: gameUpdateErr.message ?? "Could not sync game counts." };
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  revalidatePath("/player");
  return { ok: true, data: null };
}
