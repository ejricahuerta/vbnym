import { escapeEmailHtml } from "@/lib/email-payment-copy-blocks";
import {
  playerPoliciesAbsoluteUrl,
  playerPolicyBroadcastLegalBlockHtml,
  playerPolicyBroadcastLegalBlockText,
  publicAppOrigin,
} from "@/lib/player-email-legal";

export function policyUpdateBroadcastEmailHtml(): string {
  const policiesUrl = playerPoliciesAbsoluteUrl();
  const homeUrl = `${publicAppOrigin()}/`;
  const p = escapeEmailHtml(policiesUrl);
  const h = escapeEmailHtml(homeUrl);
  const legal = playerPolicyBroadcastLegalBlockHtml(policiesUrl);

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#0f274f;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Player policies update</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 12px;font-size:20px;color:#131b2e">Updated information in our emails</h2>
          <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6">
            We now include cancellation rules, refund timing, waitlist payment windows, and liability waiver context in
            messages we send about games. Nothing in this email changes your payment status, roster spot, or waitlist
            position.
          </p>
          <p style="margin:0 0 18px;color:#334155;font-size:14px;line-height:1.6">
            A single page has the full text for your records or to share with anyone in your group:
            <a href="${p}" style="color:#0f274f;font-weight:700">Player policies &amp; waiver</a>.
          </p>
          <p style="margin:0 0 18px">
            <a href="${h}" style="display:inline-block;background:#0f274f;color:#ffffff;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
              View upcoming games
            </a>
          </p>
          ${legal}
        </div>
      </div>
    </div>
  `;
}

export function policyUpdateBroadcastEmailText(): string {
  const policiesUrl = playerPoliciesAbsoluteUrl();
  const homeUrl = `${publicAppOrigin()}/`;
  return [
    "North York | Markham Volleyball — player policies update",
    "",
    "We now include cancellation rules, refund timing, waitlist payment windows, and liability waiver context in emails about games.",
    "This message does not change your payment status, roster spot, or waitlist position.",
    "",
    `Full policies & waiver: ${policiesUrl}`,
    `Upcoming games: ${homeUrl}`,
    playerPolicyBroadcastLegalBlockText(policiesUrl),
  ].join("\n");
}
