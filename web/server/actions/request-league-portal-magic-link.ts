'use server';

import { LEAGUE_PORTAL_MAGIC_LINK_TTL_MS } from "@/lib/league-portal-cookie";
import { createLeaguePortalMagicLinkToken } from "@/lib/league-magic-link";
import { sendTransactionalEmailResult } from "@/lib/notifications";
import { publicSiteOrigin } from "@/lib/site-origin";
import { getLeagueTeamPortalBundlesForEmail } from "@/server/queries/team-portal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RequestLeaguePortalMagicLinkResult =
  | { ok: true; emailed: boolean }
  | { ok: false; error: string };

export async function requestLeaguePortalMagicLink(
  formData: FormData
): Promise<RequestLeaguePortalMagicLinkResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const secret = process.env.PLAYER_AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return {
      ok: false,
      error: "Sign-in links are not configured. Please contact the organizer.",
    };
  }

  const bundles = await getLeagueTeamPortalBundlesForEmail(email);
  if (bundles.length === 0) {
    return { ok: true, emailed: false };
  }

  const token = createLeaguePortalMagicLinkToken(email);
  if (!token) {
    return { ok: false, error: "Could not create a sign-in link. Try again later." };
  }

  const minutes = Math.max(1, Math.round(LEAGUE_PORTAL_MAGIC_LINK_TTL_MS / 60_000));
  const origin = publicSiteOrigin();
  const link = `${origin}/app/league-team/recover?t=${encodeURIComponent(token)}`;

  const subject = "Your league team portal → sign-in link";
  const html = `
    <p>Hi,</p>
    <p>Open the button below to view your <strong>league schedule and roster</strong>. This link expires in about ${minutes} minutes.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
        Open team portal
      </a>
    </p>
    <p style="font-size:13px;color:#64748b;">If the button does not work, copy and paste this URL into your browser:<br/>
    <span style="word-break:break-all;">${link}</span></p>
    <p style="font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
  `;
  const text = `Open your league team portal (expires in about ${minutes} minutes):\n${link}\n`;

  const sent = await sendTransactionalEmailResult({
    to: email,
    subject,
    html,
    text,
  });

  if (!sent.ok) {
    return {
      ok: false,
      error: sent.error.startsWith("Email is not configured")
        ? sent.error
        : `We could not send email right now. ${sent.error}`,
    };
  }

  return { ok: true, emailed: true };
}
