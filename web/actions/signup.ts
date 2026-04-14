"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePaymentCode } from "@/lib/payment-code";
import {
  formatGameCourtLine,
  formatGameDateLong,
  formatGameTimeRangeLabel,
  registrationNotYetOpen,
} from "@/lib/game-display";
import { normalizeGame } from "@/lib/data/games";
import type { Game } from "@/types/vbnym";
import { enqueueWaitlistAndNotify, processWaitlistForGame } from "@/lib/waitlist";
import { sendTransactionalEmail } from "@/lib/notifications";
import {
  emailPaymentCopyHintHtml,
  emailSelectableValueBlock,
  escapeEmailHtml,
} from "@/lib/email-payment-copy-blocks";
import { PAYMENT_CODE_EXPIRY_MINUTES } from "@/lib/registration-policy";
import {
  playerEmailLegalFooterHtml,
  playerEmailLegalFooterText,
  playerPoliciesAbsoluteUrl,
} from "@/lib/player-email-legal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupResult = {
  ok: boolean;
  error?: string;
  waitlisted?: boolean;
  paymentCode?: string;
  etransfer?: string;
  /** Payer + listed friends */
  headCount?: number;
  totalDue?: number;
  paymentCodeExpiresAt?: string;
};

function signupPaymentEmailHtml(opts: {
  name: string;
  game: Game;
  paymentCode: string;
  etransfer: string;
  headCount: number;
  totalDue: number;
  gameUrl: string;
  policiesUrl: string;
}): string {
  const loc = escapeEmailHtml(opts.game.location);
  const courtLine = formatGameCourtLine(opts.game.court);
  const courtBlock = courtLine
    ? `<p style="margin:-4px 0 12px;color:#475569;font-size:13px">${escapeEmailHtml(courtLine)}</p>`
    : "";
  const when = escapeEmailHtml(
    `${formatGameDateLong(opts.game.date)} · ${formatGameTimeRangeLabel(opts.game)}`
  );
  const payer = escapeEmailHtml(opts.name);
  const link = escapeEmailHtml(opts.gameUrl);
  const etBlock = emailSelectableValueBlock("Interac e-transfer recipient", opts.etransfer, {
    monospace: false,
  });
  const codeBlock = emailSelectableValueBlock("Message (copy exactly)", opts.paymentCode, {
    monospace: true,
  });
  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#0f274f;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Payment instructions</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px;color:#131b2e">Complete your e-transfer</h2>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${payer}, you&apos;re registered for <strong>${loc}</strong><br />
            <span style="color:#64748b;font-size:13px">${when}</span>
          </p>
          ${courtBlock}
          ${etBlock}
          ${codeBlock}
          ${emailPaymentCopyHintHtml()}
          <p style="margin:0 0 8px;color:#334155;font-size:14px">
            Group size: <strong>${opts.headCount}</strong><br />
            Total due: <strong>$${opts.totalDue.toFixed(2)}</strong>
          </p>
          <p style="margin:0 0 14px;color:#64748b;font-size:12px;line-height:1.6">
            Your payment code expires in ${PAYMENT_CODE_EXPIRY_MINUTES} minutes. Unpaid signups are automatically cancelled after expiry.
          </p>
          <p style="margin:0 0 18px">
            <a href="${link}" style="display:inline-block;background:#0f274f;color:#ffffff;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
              View game details
            </a>
          </p>
          <p style="margin:0 0 14px;color:#94a3b8;font-size:12px;line-height:1.6">
            If you did not sign up for this game, you can ignore this email.
          </p>
          ${playerEmailLegalFooterHtml({
            policiesUrl: opts.policiesUrl,
            waiverAccepted: true,
          })}
        </div>
      </div>
    </div>
  `;
}

function signupPaymentEmailText(opts: {
  name: string;
  game: Game;
  paymentCode: string;
  etransfer: string;
  headCount: number;
  totalDue: number;
  gameUrl: string;
  policiesUrl: string;
}): string {
  const courtLine = formatGameCourtLine(opts.game.court);
  const when = `${formatGameDateLong(opts.game.date)} · ${formatGameTimeRangeLabel(opts.game)}`;
  return [
    `Hi ${opts.name},`,
    ``,
    `You're registered for ${opts.game.location}`,
    when,
    ...(courtLine ? [courtLine] : []),
    ``,
    `Interac e-transfer recipient (copy exactly):`,
    opts.etransfer,
    ``,
    `Interac message / memo (copy exactly — entire line):`,
    opts.paymentCode,
    ``,
    `Group size: ${opts.headCount}`,
    `Total due: $${opts.totalDue.toFixed(2)}`,
    ``,
    `Your payment code expires in ${PAYMENT_CODE_EXPIRY_MINUTES} minutes. Unpaid signups are automatically cancelled after expiry.`,
    ``,
    `View game details: ${opts.gameUrl}`,
    ``,
    `If you did not sign up for this game, you can ignore this email.`,
    playerEmailLegalFooterText({
      policiesUrl: opts.policiesUrl,
      waiverAccepted: true,
    }),
  ].join("\n");
}

export async function signupForRun(formData: FormData): Promise<SignupResult> {
  const gameId = String(formData.get("game_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const friendsFromList = formData
    .getAll("friends[]")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const legacyFriends = [
    String(formData.get("friend_1") ?? "").trim(),
    String(formData.get("friend_2") ?? "").trim(),
  ].filter(Boolean);
  const friends = (friendsFromList.length > 0 ? friendsFromList : legacyFriends).slice(0, 6);
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const waiverAccepted = String(formData.get("waiver_accepted") ?? "") === "on";
  const onBehalf = String(formData.get("on_behalf") ?? "") === "on";

  if (!gameId || !name || !email) {
    return { ok: false, error: "Name and email are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!waiverAccepted) {
    return { ok: false, error: "You must accept the liability waiver." };
  }

  const secret = process.env.PAYMENT_CODE_SECRET;
  if (!secret) {
    return {
      ok: false,
      error: "Server is not configured (missing PAYMENT_CODE_SECRET).",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "Server is not configured (missing service role key).",
    };
  }

  const { data: gameRow, error: gameErr } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameErr || !gameRow) {
    return { ok: false, error: "Game not found." };
  }

  const game = normalizeGame(gameRow as Game);
  if (game.listed === false) {
    return { ok: false, error: "This game is not open for registration." };
  }
  if (registrationNotYetOpen(game)) {
    return { ok: false, error: "Registration is not open yet for this game." };
  }

  if (!onBehalf) {
    const { data: existingSignup } = await admin
      .from("signups")
      .select("id, paid, payment_code, payment_code_expires_at, friends")
      .eq("game_id", gameId)
      .eq("email", email)
      .maybeSingle();

    if (existingSignup) {
      const s = existingSignup as Pick<
        import("@/types/vbnym").Signup,
        "id" | "paid" | "payment_code" | "payment_code_expires_at" | "friends"
      >;
      if (s.paid) {
        return {
          ok: false,
          error: "You are already registered and paid for this game.",
        };
      }
      const expiresAt = s.payment_code_expires_at
        ? new Date(s.payment_code_expires_at).getTime()
        : null;
      if (!expiresAt || expiresAt > Date.now()) {
        return {
          ok: false,
          error:
            "You already have a pending registration for this game. Complete your e-transfer or wait for your hold to expire before signing up again.",
        };
      }
    }
  }

  await processWaitlistForGame(admin, game);

  const newHeads = 1 + friends.length;
  const id = randomUUID();
  const paymentCode = generatePaymentCode(gameId, id, email, secret);
  const paymentCodeExpiresAt = new Date(
    Date.now() + PAYMENT_CODE_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  const { data: rpcData, error: rpcErr } = await admin.rpc("signup_for_game", {
    p_id: id,
    p_game_id: gameId,
    p_name: name,
    p_email: email,
    p_friends: friends,
    p_phone: phone,
    p_waiver_accepted: waiverAccepted,
    p_payment_code: paymentCode,
    p_payment_code_expires_at: paymentCodeExpiresAt,
  });

  if (rpcErr) {
    return {
      ok: false,
      error: rpcErr.message || "Could not save signup.",
    };
  }

  const outcome = rpcData as {
    ok?: boolean;
    reason?: string;
    detail?: string;
  };

  if (!outcome?.ok) {
    if (outcome.reason === "full") {
      const waitlist = await enqueueWaitlistAndNotify(admin, {
        game,
        name,
        email,
        friends,
        phone,
        waiverAccepted,
      });
      return {
        ok: false,
        waitlisted: waitlist.waitlisted,
        error: waitlist.message,
      };
    }
    if (outcome.reason === "game_not_found") {
      return { ok: false, error: "Game not found." };
    }
    if (outcome.reason === "duplicate_payment_code") {
      return { ok: false, error: "Please try again." };
    }
    return {
      ok: false,
      error: outcome.detail || "Could not save signup.",
    };
  }

  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);
  const price = Number(game.price);
  const totalDue = Math.round(price * newHeads * 100) / 100;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const gameUrl = new URL(`/games/${gameId}`, appUrl).toString();
  const policiesUrl = playerPoliciesAbsoluteUrl();

  const emailOpts = {
    name,
    game,
    paymentCode,
    etransfer: game.etransfer as string,
    headCount: newHeads,
    totalDue,
    gameUrl,
    policiesUrl,
  };
  await sendTransactionalEmail({
    to: email,
    subject: `NYM Volleyball — pay for ${game.location}`,
    html: signupPaymentEmailHtml(emailOpts),
    text: signupPaymentEmailText(emailOpts),
  });

  return {
    ok: true,
    paymentCode,
    etransfer: game.etransfer as string,
    headCount: newHeads,
    totalDue,
    paymentCodeExpiresAt,
  };
}
