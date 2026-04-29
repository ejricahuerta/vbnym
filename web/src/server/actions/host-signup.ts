'use server';

import { revalidatePath } from "next/cache";

import { getHostSessionEmail } from "@/lib/auth";
import { buildPlayerPaymentConfirmedEmailTemplate } from "@/lib/email-templates";
import { appOrigin } from "@/lib/env";
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
    .select("id, title, starts_at, host_name, host_email, price_cents, owner_email, signed_count, waitlist_count")
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
    }>();

  if (gameErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  if (game.owner_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only update games you host." };
  }

  const { data: signup } = await supabase
    .from("signups")
    .select("id, player_name, player_email, payment_status, status")
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      player_name: string;
      player_email: string;
      payment_status: "paid" | "pending" | "refund" | "canceled";
      status: "active" | "waitlist" | "canceled" | "removed" | "deleted";
    }>();

  if (!signup) {
    return { ok: false, error: "Sign-up not found." };
  }

  const nextPaymentStatus = parsed.data.paymentStatus;
  const shouldAutoCancelRoster =
    (nextPaymentStatus === "refund" || nextPaymentStatus === "canceled") &&
    (signup.status === "active" || signup.status === "waitlist");
  const nextRosterStatus = shouldAutoCancelRoster ? "canceled" : signup.status;

  const updatePayload: { payment_status: "paid" | "pending" | "refund" | "canceled"; status?: "canceled" } = {
    payment_status: nextPaymentStatus,
  };
  if (shouldAutoCancelRoster) {
    updatePayload.status = "canceled";
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
  }

  const becamePaid = nextPaymentStatus === "paid" && signup?.payment_status !== "paid" && nextRosterStatus !== "deleted";
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
      status: "active" | "waitlist" | "canceled" | "removed" | "deleted";
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
    } else if (nextStatus === "canceled" || nextStatus === "removed" || nextStatus === "deleted") {
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
    } else if (nextStatus === "canceled" || nextStatus === "removed" || nextStatus === "deleted") {
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
