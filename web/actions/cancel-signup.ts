"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeGame } from "@/lib/data/games";
import { sendTransactionalEmail } from "@/lib/notifications";
import {
  formatGameCourtLine,
  formatGameDateLong,
  formatGameTimeRangeLabel,
} from "@/lib/game-display";
import { escapeEmailHtml } from "@/lib/email-payment-copy-blocks";
import {
  isBeforeCancellationCutoff,
  CANCELLATION_MIN_HOURS_BEFORE_GAME,
  GAME_SCHEDULE_TIMEZONE_LABEL,
} from "@/lib/registration-policy";
import {
  playerEmailLegalFooterHtml,
  playerEmailLegalFooterText,
  playerPoliciesAbsoluteUrl,
} from "@/lib/player-email-legal";
import { processWaitlistForGame } from "@/lib/waitlist";
import type { Game, Signup } from "@/types/vbnym";

export type CancelResult = {
  ok: boolean;
  error?: string;
};

function cancellationEmailHtml(opts: {
  name: string;
  game: Game;
  wasPaid: boolean;
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
  const refundNote = opts.wasPaid
    ? "Since you already paid, any eligible refund will be processed after the game is settled."
    : "No payment was received, so no refund is needed.";

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#0f274f;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Cancellation confirmed</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px;color:#131b2e">Your registration is cancelled</h2>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${payer}, your registration for <strong>${loc}</strong> has been cancelled.
          </p>
          ${courtBlock}
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            <span style="color:#64748b;font-size:13px">${when}</span>
          </p>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            ${refundNote}
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

function cancellationEmailText(opts: {
  name: string;
  game: Game;
  wasPaid: boolean;
  policiesUrl: string;
}): string {
  const courtLine = formatGameCourtLine(opts.game.court);
  const when = `${formatGameDateLong(opts.game.date)} · ${formatGameTimeRangeLabel(opts.game)}`;
  const refundNote = opts.wasPaid
    ? "Since you already paid, any eligible refund will be processed after the game is settled."
    : "No payment was received, so no refund is needed.";

  return [
    `Hi ${opts.name},`,
    ``,
    `Your registration for ${opts.game.location} has been cancelled.`,
    when,
    ...(courtLine ? [courtLine] : []),
    ``,
    refundNote,
    playerEmailLegalFooterText({
      policiesUrl: opts.policiesUrl,
      waiverAccepted: true,
    }),
  ].join("\n");
}

export async function cancelSignup(formData: FormData): Promise<CancelResult> {
  const gameId = String(formData.get("game_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!gameId || !email) {
    return { ok: false, error: "Game ID and email are required." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is not configured." };
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

  if (!isBeforeCancellationCutoff(game)) {
    return {
      ok: false,
      error: `Cancellations must be made at least ${CANCELLATION_MIN_HOURS_BEFORE_GAME} hours before the scheduled start (${GAME_SCHEDULE_TIMEZONE_LABEL}). Contact the organizer directly for late cancellations.`,
    };
  }

  const { data: signupRow, error: signupErr } = await admin
    .from("signups")
    .select("*")
    .eq("game_id", gameId)
    .eq("email", email)
    .maybeSingle();

  if (signupErr || !signupRow) {
    return { ok: false, error: "No registration found for this email and game." };
  }

  const signup = signupRow as Signup;
  const wasPaid = signup.paid;

  const { error: deleteErr } = await admin
    .from("signups")
    .delete()
    .eq("id", signup.id);

  if (deleteErr) {
    return { ok: false, error: "Could not cancel registration. Please try again." };
  }

  await processWaitlistForGame(admin, game);

  revalidatePath("/");
  revalidatePath("/app");
  revalidatePath(`/app/games/${gameId}`);

  const policiesUrl = playerPoliciesAbsoluteUrl();
  try {
    await sendTransactionalEmail({
      to: email,
      subject: `NYM Volleyball — cancellation confirmed for ${game.location}`,
      html: cancellationEmailHtml({ name: signup.name, game, wasPaid, policiesUrl }),
      text: cancellationEmailText({ name: signup.name, game, wasPaid, policiesUrl }),
    });
  } catch {
    // cancellation still succeeded even if email fails
  }

  return { ok: true };
}
