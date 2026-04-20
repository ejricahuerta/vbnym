import { escapeEmailHtml } from "@/lib/email-payment-copy-blocks";
import {
  CANCELLATION_MIN_HOURS_BEFORE_GAME,
  GAME_SCHEDULE_TIMEZONE_LABEL,
  PAYMENT_CODE_EXPIRY_MINUTES,
  WAITLIST_INVITE_MINUTES,
} from "@/lib/registration-policy";

/** Public page with registration timing, refunds, cancellations, and full waiver text (for email links). */
export const PLAYER_POLICIES_PATH = "/player-policies";

export function publicAppOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function playerPoliciesAbsoluteUrl(): string {
  return `${publicAppOrigin()}${PLAYER_POLICIES_PATH}`;
}

export function playerEmailLegalFooterHtml(opts: {
  policiesUrl: string;
  waiverAccepted: boolean;
  /** Short phrase, e.g. "when you joined the waitlist" (plain text, will be escaped). */
  waiverContextLine?: string;
}): string {
  const url = escapeEmailHtml(opts.policiesUrl);
  const ctx = opts.waiverContextLine?.trim()
    ? ` ${escapeEmailHtml(opts.waiverContextLine.trim())}`
    : " when you completed registration";
  const waiverHtml = opts.waiverAccepted
    ? `You accepted our liability waiver and release of claims${ctx}.`
    : `We do not have a recorded waiver acceptance for this registration. If that is wrong, contact the organizers right away.`;

  return `
        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0">
          <p style="margin:0 0 8px;color:#334155;font-size:13px;line-height:1.6"><strong>Legal &amp; policies</strong></p>
          <p style="margin:0 0 10px;color:#334155;font-size:12px;line-height:1.6"><strong>Liability waiver:</strong> ${waiverHtml}</p>
          <p style="margin:0 0 10px;color:#64748b;font-size:12px;line-height:1.6">
            <strong>Payments:</strong> e-transfer codes expire in ${PAYMENT_CODE_EXPIRY_MINUTES} minutes; unpaid registrations cancel automatically.
            <strong> Waitlist:</strong> if you are invited off the list, you have ${WAITLIST_INVITE_MINUTES} minutes to pay or the offer may move on.
          </p>
          <p style="margin:0 0 10px;color:#64748b;font-size:12px;line-height:1.6">
            <strong>Cancellations:</strong> contact us at least ${CANCELLATION_MIN_HOURS_BEFORE_GAME} hours before the scheduled start (${GAME_SCHEDULE_TIMEZONE_LABEL}).
            <strong> Refunds:</strong> any amounts owed are sent after games are settled (for example if a run is cancelled or adjusted).
          </p>
          <p style="margin:0 0 8px;color:#0f274f;font-size:12px;line-height:1.6">
            <a href="${url}" style="color:#0f274f;font-weight:700">Full policies &amp; waiver on our website</a>
          </p>
          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5">
            North York | Markham Volleyball (NYM) is a recreational drop-in program. Participation involves inherent injury risk. This email relates to your registration only.
          </p>
        </div>`;
}

export function playerEmailLegalFooterText(opts: {
  policiesUrl: string;
  waiverAccepted: boolean;
  waiverContextLine?: string;
}): string {
  const ctx = opts.waiverContextLine?.trim()
    ? ` ${opts.waiverContextLine.trim()}`
    : " when you completed registration";
  const waiverLine = opts.waiverAccepted
    ? `Liability waiver: You accepted our liability waiver and release of claims${ctx}.`
    : "Liability waiver: Not on file—contact organizers if that is incorrect.";

  return [
    "",
    "---",
    "Legal & policies",
    waiverLine,
    `Payments: e-transfer codes expire in ${PAYMENT_CODE_EXPIRY_MINUTES} minutes; unpaid registrations cancel automatically.`,
    `Waitlist: if invited, you have ${WAITLIST_INVITE_MINUTES} minutes to pay or the offer may move on.`,
    `Cancellations: contact us at least ${CANCELLATION_MIN_HOURS_BEFORE_GAME} hours before start (${GAME_SCHEDULE_TIMEZONE_LABEL}).`,
    "Refunds: if owed, sent after games are settled.",
    `Full policies & waiver: ${opts.policiesUrl}`,
    "NYM is recreational drop-in volleyball; participation involves inherent risk.",
  ].join("\n");
}
