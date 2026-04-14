import { randomUUID } from "node:crypto";
import { bookedHeadsForGame, type Game, type Signup } from "@/types/vbnym";
import { generatePaymentCode } from "@/lib/payment-code";
import { sendTransactionalEmail } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatGameCourtLine } from "@/lib/game-display";
import {
  emailPaymentCopyHintHtml,
  emailSelectableValueBlock,
  escapeEmailHtml,
} from "@/lib/email-payment-copy-blocks";
import {
  PAYMENT_CODE_EXPIRY_MINUTES,
  WAITLIST_INVITE_MINUTES,
} from "@/lib/registration-policy";
import {
  playerEmailLegalFooterHtml,
  playerEmailLegalFooterText,
  playerPoliciesAbsoluteUrl,
} from "@/lib/player-email-legal";

type WaitlistSignup = {
  id: string;
  game_id: string;
  signup_id: string | null;
  name: string;
  email: string;
  phone?: string | null;
  friends?: string[] | null;
  waiver_accepted?: boolean | null;
  status: "pending" | "invited" | "joined" | "expired" | "removed";
  invited_at?: string | null;
  invitation_expires_at?: string | null;
  created_at?: string;
};

type AdminLike = ReturnType<typeof createAdminClient>;

type EnqueueInput = {
  game: Game;
  name: string;
  email: string;
  friends: string[];
  phone: string | null;
  waiverAccepted: boolean;
};

function isExpiredUnpaidSignup(s: Signup, nowMs: number): boolean {
  if (s.paid) return false;
  if (!s.payment_code_expires_at) return false;
  const t = new Date(s.payment_code_expires_at).getTime();
  return Number.isFinite(t) && t <= nowMs;
}

function inviteEmailHtml(params: {
  game: Game;
  name: string;
  etransfer: string;
  paymentCode: string;
  groupSize: number;
  totalDue: number;
  gameUrl: string;
  policiesUrl: string;
  waiverAccepted: boolean;
}): string {
  const loc = escapeEmailHtml(params.game.location);
  const courtLine = formatGameCourtLine(params.game.court);
  const courtBlock = courtLine
    ? `<p style="margin:-4px 0 12px;color:#334155;font-size:13px">${escapeEmailHtml(courtLine)}</p>`
    : "";
  const nameEsc = escapeEmailHtml(params.name);
  const link = escapeEmailHtml(params.gameUrl);
  const etBlock = emailSelectableValueBlock("E-transfer email", params.etransfer, { monospace: false });
  const codeBlock = emailSelectableValueBlock("Payment code (message field)", params.paymentCode, {
    monospace: true,
  });
  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#0f274f;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Waitlist Spot Opened</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px;color:#131b2e">A spot opened for ${loc}</h2>
          ${courtBlock}
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${nameEsc}, your waitlist spot is now open. You have ${WAITLIST_INVITE_MINUTES} minutes to complete payment and claim it.
          </p>
          ${etBlock}
          ${codeBlock}
          ${emailPaymentCopyHintHtml()}
          <p style="margin:0 0 8px;color:#334155;font-size:14px">
            Group size: <strong>${params.groupSize}</strong><br />
            Total due: <strong>$${params.totalDue.toFixed(2)}</strong>
          </p>
          <p style="margin:0 0 14px;color:#94a3b8;font-size:12px;line-height:1.6">
            If payment is not received in ${WAITLIST_INVITE_MINUTES} minutes, your invite expires and the next waitlisted player is notified.
          </p>
          <p style="margin:0 0 18px">
            <a href="${link}" style="display:inline-block;background:#0f274f;color:#ffffff;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
              View game details
            </a>
          </p>
          ${playerEmailLegalFooterHtml({
            policiesUrl: params.policiesUrl,
            waiverAccepted: params.waiverAccepted,
            waiverContextLine: "when you joined the waitlist",
          })}
        </div>
      </div>
    </div>
  `;
}

function inviteEmailText(params: {
  game: Game;
  name: string;
  etransfer: string;
  paymentCode: string;
  groupSize: number;
  totalDue: number;
  gameUrl: string;
  policiesUrl: string;
  waiverAccepted: boolean;
}): string {
  const courtLine = formatGameCourtLine(params.game.court);
  return [
    `Hi ${params.name},`,
    ``,
    `A spot opened for ${params.game.location}.`,
    ...(courtLine ? [courtLine] : []),
    `You have ${WAITLIST_INVITE_MINUTES} minutes to complete payment and claim it.`,
    ``,
    `E-transfer email (copy exactly):`,
    params.etransfer,
    ``,
    `Payment code — message field (copy exactly):`,
    params.paymentCode,
    ``,
    `Group size: ${params.groupSize}`,
    `Total due: $${params.totalDue.toFixed(2)}`,
    ``,
    `View game details: ${params.gameUrl}`,
    ``,
    `If payment is not received in ${WAITLIST_INVITE_MINUTES} minutes, your invite expires and the next waitlisted player is notified.`,
    playerEmailLegalFooterText({
      policiesUrl: params.policiesUrl,
      waiverAccepted: params.waiverAccepted,
      waiverContextLine: "when you joined the waitlist",
    }),
  ].join("\n");
}

function fullEmailHtml(params: {
  game: Game;
  name: string;
  allPaid: boolean;
  policiesUrl: string;
  waiverAccepted: boolean;
}): string {
  const detail = params.allPaid
    ? "The game is currently full and all current spots are paid."
    : `The game is currently full. Some spots are held by unpaid signups and may release after ${PAYMENT_CODE_EXPIRY_MINUTES} minutes.`;
  const loc = escapeEmailHtml(params.game.location);
  const nameEsc = escapeEmailHtml(params.name);
  const courtLine = formatGameCourtLine(params.game.court);
  const courtBlock = courtLine
    ? `<p style="margin:-4px 0 10px;color:#334155;font-size:13px">${escapeEmailHtml(courtLine)}</p>`
    : "";

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#0f274f;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Waitlist Update</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px;color:#131b2e">You are on the waitlist</h2>
          <p style="margin:0 0 10px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${nameEsc}, thanks for joining the waitlist for ${loc}.
          </p>
          ${courtBlock}
          <p style="margin:0 0 10px;color:#334155;font-size:14px;line-height:1.6">${detail}</p>
          <p style="margin:0 0 14px;color:#94a3b8;font-size:12px;line-height:1.6">
            When a spot opens, we will email you right away with a ${PAYMENT_CODE_EXPIRY_MINUTES}-minute e-transfer payment code.
          </p>
          ${playerEmailLegalFooterHtml({
            policiesUrl: params.policiesUrl,
            waiverAccepted: params.waiverAccepted,
            waiverContextLine: "when you joined the waitlist",
          })}
        </div>
      </div>
    </div>
  `;
}

function fullEmailText(params: {
  game: Game;
  name: string;
  allPaid: boolean;
  policiesUrl: string;
  waiverAccepted: boolean;
}): string {
  const detail = params.allPaid
    ? "The game is currently full and all current spots are paid."
    : `The game is currently full. Some spots are held by unpaid signups and may release after ${PAYMENT_CODE_EXPIRY_MINUTES} minutes.`;
  const courtLine = formatGameCourtLine(params.game.court);
  return [
    `Hi ${params.name},`,
    ``,
    `Thanks for joining the waitlist for ${params.game.location}.`,
    ...(courtLine ? [courtLine] : []),
    detail,
    `When a spot opens, we will email you right away with a ${PAYMENT_CODE_EXPIRY_MINUTES}-minute e-transfer payment code.`,
    playerEmailLegalFooterText({
      policiesUrl: params.policiesUrl,
      waiverAccepted: params.waiverAccepted,
      waiverContextLine: "when you joined the waitlist",
    }),
  ].join("\n");
}

export async function enqueueWaitlistAndNotify(
  admin: AdminLike,
  input: EnqueueInput
): Promise<{ waitlisted: boolean; message: string }> {
  const nowIso = new Date().toISOString();
  const { data: activeSignups } = await admin
    .from("signups")
    .select("*")
    .eq("game_id", input.game.id);

  const live = ((activeSignups ?? []) as Signup[]).filter(
    (s) => !isExpiredUnpaidSignup(s, Date.now())
  );
  const booked = bookedHeadsForGame(live);
  if (booked < input.game.cap) {
    return {
      waitlisted: false,
      message: "A spot just opened. Please try submitting again now.",
    };
  }

  const allPaid = live.length > 0 && live.every((s) => s.paid);
  const fullReason = allPaid ? "all_paid" : "holding_unpaid";
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("waitlist_signups")
    .select("*")
    .eq("game_id", input.game.id)
    .eq("email", normalizedEmail)
    .in("status", ["pending", "invited"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      waitlisted: true,
      message: "You are already on the waitlist. We will email you if a spot opens.",
    };
  }

  await admin.from("waitlist_signups").insert({
    game_id: input.game.id,
    name: input.name,
    email: normalizedEmail,
    phone: input.phone ?? undefined,
    friends: input.friends,
    waiver_accepted: input.waiverAccepted,
    status: "pending",
    full_reason: fullReason,
    notified_full_at: nowIso,
  });

  const policiesUrl = playerPoliciesAbsoluteUrl();
  const fullParams = {
    game: input.game,
    name: input.name,
    allPaid,
    policiesUrl,
    waiverAccepted: input.waiverAccepted,
  };
  await sendTransactionalEmail({
    to: normalizedEmail,
    subject: allPaid
      ? "NYM waitlist: game full (all paid)"
      : "NYM waitlist: game currently full",
    html: fullEmailHtml(fullParams),
    text: fullEmailText(fullParams),
  });

  return {
    waitlisted: true,
    message:
      "Game is full. You were added to the waitlist and we emailed you with next steps.",
  };
}

export async function processWaitlistForGame(
  admin: AdminLike,
  game: Game
): Promise<void> {
  const now = new Date();
  const nowIso = now.toISOString();

  await admin
    .from("signups")
    .delete()
    .eq("game_id", game.id)
    .eq("paid", false)
    .lt("payment_code_expires_at", nowIso);

  const { data: staleInvites } = await admin
    .from("waitlist_signups")
    .select("*")
    .eq("game_id", game.id)
    .eq("status", "invited")
    .lt("invitation_expires_at", nowIso);

  for (const row of (staleInvites ?? []) as WaitlistSignup[]) {
    if (row.signup_id) {
      await admin
        .from("signups")
        .delete()
        .eq("id", row.signup_id)
        .eq("paid", false);
    }
    await admin
      .from("waitlist_signups")
      .update({ status: "expired" })
      .eq("id", row.id);
  }

  const { data: signupsAfterCleanup } = await admin
    .from("signups")
    .select("*")
    .eq("game_id", game.id);
  const liveSignups = ((signupsAfterCleanup ?? []) as Signup[]).filter(
    (s) => !isExpiredUnpaidSignup(s, now.getTime())
  );
  let available = game.cap - bookedHeadsForGame(liveSignups);
  if (available <= 0) return;

  const { data: pendingWaitlist } = await admin
    .from("waitlist_signups")
    .select("*")
    .eq("game_id", game.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const secret = process.env.PAYMENT_CODE_SECRET;
  if (!secret) return;

  for (const row of (pendingWaitlist ?? []) as WaitlistSignup[]) {
    const heads = 1 + (row.friends?.length ?? 0);
    if (heads > available) continue;

    const signupId = randomUUID();
    const paymentCode = generatePaymentCode(game.id, signupId, row.email, secret);
    const inviteExpiresAt = new Date(
      Date.now() + WAITLIST_INVITE_MINUTES * 60 * 1000
    ).toISOString();
    const price = Number(game.price);
    const totalDue = Math.round(price * heads * 100) / 100;

    const { error: signupErr } = await admin.from("signups").insert({
      id: signupId,
      game_id: game.id,
      name: row.name,
      email: row.email,
      friends: row.friends ?? [],
      paid: false,
      payment_code: paymentCode,
      payment_code_expires_at: inviteExpiresAt,
      phone: row.phone ?? undefined,
      waiver_accepted: row.waiver_accepted ?? true,
    });

    if (signupErr) continue;

    await admin
      .from("waitlist_signups")
      .update({
        status: "invited",
        signup_id: signupId,
        invited_at: nowIso,
        invitation_expires_at: inviteExpiresAt,
        notified_invited_at: nowIso,
      })
      .eq("id", row.id);

    const courtSubject = formatGameCourtLine(game.court);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const gameUrl = new URL(`/games/${game.id}`, appUrl).toString();
    const policiesUrl = playerPoliciesAbsoluteUrl();
    const inviteOpts = {
      game,
      name: row.name,
      etransfer: game.etransfer,
      paymentCode,
      groupSize: heads,
      totalDue,
      gameUrl,
      policiesUrl,
      waiverAccepted: Boolean(row.waiver_accepted ?? true),
    };
    await sendTransactionalEmail({
      to: row.email,
      subject: courtSubject
        ? `Spot open for ${game.location} (${courtSubject}) - complete payment in ${WAITLIST_INVITE_MINUTES} min`
        : `Spot open for ${game.location} - complete payment in ${WAITLIST_INVITE_MINUTES} min`,
      html: inviteEmailHtml(inviteOpts),
      text: inviteEmailText(inviteOpts),
    });

    available -= heads;
    if (available <= 0) break;
  }
}
