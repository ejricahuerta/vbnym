import "server-only";

import { escapeEmailHtml } from "@/lib/email-payment-copy-blocks";
import {
  leagueEmailLegalFooterHtml,
  leagueEmailLegalFooterText,
  playerPoliciesAbsoluteUrl,
} from "@/lib/player-email-legal";
import { publicSiteOrigin } from "@/lib/site-origin";
import { sendTransactionalEmailResult } from "@/lib/notifications";

export async function sendLeagueMemberInviteEmail(opts: {
  to: string;
  teamName: string;
  leagueName: string;
  seasonName: string;
  inviteToken: string;
  waiverVersionLabel?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = publicSiteOrigin();
  const path = `/leagues/invite/${opts.inviteToken}`;
  const link = `${origin}${path}`;
  const policiesUrl = playerPoliciesAbsoluteUrl();

  const subject = `You're invited → ${opts.teamName} (${opts.leagueName})`;
  const html = `
    <p>Hi,</p>
    <p>You&apos;ve been invited to join <strong>${escapeEmailHtml(opts.teamName)}</strong> in
    <strong>${escapeEmailHtml(opts.leagueName)}</strong> → ${escapeEmailHtml(opts.seasonName)}.</p>
    <p style="margin:24px 0;">
      <a href="${escapeEmailHtml(link)}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
        Accept invite and sign waiver
      </a>
    </p>
    <p style="font-size:13px;color:#64748b;">If the button doesn&apos;t work, copy this URL:<br/>
    <span style="word-break:break-all;">${escapeEmailHtml(link)}</span></p>
    ${leagueEmailLegalFooterHtml({
      policiesUrl,
      waiverAccepted: false,
      waiverVersionLabel: opts.waiverVersionLabel,
    })}
  `;
  const text = [
    `You're invited to ${opts.teamName} (${opts.leagueName} → ${opts.seasonName}).`,
    `Open: ${link}`,
    leagueEmailLegalFooterText({
      policiesUrl,
      waiverAccepted: false,
      waiverVersionLabel: opts.waiverVersionLabel,
    }),
  ].join("\n");

  return sendTransactionalEmailResult({ to: opts.to, subject, html, text });
}

export async function sendLeagueCaptainConfirmationEmail(opts: {
  to: string;
  captainName: string;
  teamName: string;
  leagueName: string;
  seasonName: string;
  portalHint?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = publicSiteOrigin();
  const portalUrl = `${origin}/app/league-team`;
  const policiesUrl = playerPoliciesAbsoluteUrl();
  const subject = `Team registered → ${opts.teamName}`;
  const html = `
    <p>Hi ${escapeEmailHtml(opts.captainName)},</p>
    <p><strong>${escapeEmailHtml(opts.teamName)}</strong> is registered for
    <strong>${escapeEmailHtml(opts.leagueName)}</strong> (${escapeEmailHtml(opts.seasonName)}).</p>
    <p>We emailed your players with invite links to accept the waiver and receive e-transfer instructions.</p>
    <p style="margin:24px 0;">
      <a href="${escapeEmailHtml(portalUrl)}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
        Open team portal
      </a>
    </p>
    <p style="font-size:13px;color:#64748b;">${escapeEmailHtml(opts.portalHint ?? "Use your team email to request a magic sign-in link.")}</p>
    ${leagueEmailLegalFooterHtml({ policiesUrl, waiverAccepted: true, waiverVersionLabel: undefined })}
  `;
  const text = [
    `Team ${opts.teamName} registered for ${opts.leagueName} (${opts.seasonName}).`,
    `Team portal: ${portalUrl}`,
    leagueEmailLegalFooterText({ policiesUrl, waiverAccepted: true }),
  ].join("\n");

  return sendTransactionalEmailResult({ to: opts.to, subject, html, text });
}

export async function sendLeaguePaymentInstructionsEmail(opts: {
  to: string;
  name: string;
  teamName: string;
  leagueName: string;
  seasonName: string;
  referenceCode: string;
  etransferInstructions: string;
  waiverVersionLabel: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const policiesUrl = playerPoliciesAbsoluteUrl();
  const subject = `Payment instructions → ${opts.leagueName} (${opts.referenceCode})`;
  const instr = escapeEmailHtml(opts.etransferInstructions).replace(/\n/g, "<br/>");
  const html = `
    <p>Hi ${escapeEmailHtml(opts.name)},</p>
    <p>Thanks → your waiver for <strong>${escapeEmailHtml(opts.teamName)}</strong> is on file.</p>
    <p><strong>E-transfer reference / memo:</strong> <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;">${escapeEmailHtml(opts.referenceCode)}</code></p>
    <p><strong>Instructions from the league:</strong></p>
    <div style="margin:12px 0;padding:12px 14px;background:#f8fafc;border-radius:10px;font-size:14px;line-height:1.55;color:#0f172a;">
      ${instr}
    </div>
    <p style="font-size:13px;color:#64748b;">Keep this code in your e-transfer memo so we can match your payment.</p>
    ${leagueEmailLegalFooterHtml({
      policiesUrl,
      waiverAccepted: true,
      waiverVersionLabel: opts.waiverVersionLabel,
    })}
  `;
  const text = [
    `Hi ${opts.name},`,
    ``,
    `Waiver received for ${opts.teamName} (${opts.leagueName} → ${opts.seasonName}).`,
    `Reference / memo: ${opts.referenceCode}`,
    ``,
    `E-transfer instructions:`,
    opts.etransferInstructions,
    leagueEmailLegalFooterText({
      policiesUrl,
      waiverAccepted: true,
      waiverVersionLabel: opts.waiverVersionLabel,
    }),
  ].join("\n");

  return sendTransactionalEmailResult({ to: opts.to, subject, html, text });
}
