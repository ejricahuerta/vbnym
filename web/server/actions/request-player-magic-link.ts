'use server';

import { getPlayerUpcomingGamesByEmail } from "@/server/queries/player-games-by-email";
import { PLAYER_MAGIC_LINK_TTL_MS } from "@/lib/player-recover-cookie";
import { createPlayerMagicLinkToken } from "@/lib/player-magic-link";
import { sendTransactionalEmailResult } from "@/lib/notifications";
import { publicSiteOrigin } from "@/lib/site-origin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RequestPlayerMagicLinkResult =
  | { ok: true; emailed: boolean }
  | { ok: false; error: string };

export async function requestPlayerMagicLink(
  formData: FormData
): Promise<RequestPlayerMagicLinkResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasSupabase) {
    return { ok: false, error: "Database not configured." };
  }

  const secret = process.env.PLAYER_AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return {
      ok: false,
      error: "Sign-in links are not configured. Please contact the organizer.",
    };
  }

  const { games, queryError } = await getPlayerUpcomingGamesByEmail(email);
  if (queryError) {
    return {
      ok: false,
      error: "Could not verify signups right now. Try again in a moment.",
    };
  }

  const minutes = Math.max(1, Math.round(PLAYER_MAGIC_LINK_TTL_MS / 60_000));

  if (games.length === 0) {
    return { ok: true, emailed: false };
  }

  const token = createPlayerMagicLinkToken(email);
  if (!token) {
    return { ok: false, error: "Could not create a sign-in link. Try again later." };
  }

  const origin = publicSiteOrigin();
  const link = `${origin}/app/my-games/recover?t=${encodeURIComponent(token)}`;

  const subject = "Your NYM Volleyball games — sign-in link";
  const html = `
    <p>Hi,</p>
    <p>Tap the button below to open <strong>My games</strong> in your browser. This link expires in about ${minutes} minutes.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
        Open my games
      </a>
    </p>
    <p style="font-size:13px;color:#64748b;">If the button does not work, copy and paste this URL into your browser:<br/>
    <span style="word-break:break-all;">${link}</span></p>
    <p style="font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
  `;
  const text = `Open your games (expires in about ${minutes} minutes):\n${link}\n`;

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
