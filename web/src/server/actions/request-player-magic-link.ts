'use server';

import { getPlayerSignupsWithUpcomingGamesByEmail } from "@/server/queries/player-signups-by-email";
import { buildPlayerMagicLinkEmailTemplate } from "@/lib/email-templates";
import { appOrigin } from "@/lib/env";
import { MAGIC_LINK_TTL_MS } from "@/lib/magic-auth-cookies";
import { MAGIC_LINK_CALLBACK_PATH } from "@/lib/magic-link-callback";
import { createPlayerMagicLinkToken } from "@/lib/magic-link";
import { MAGIC_LINK_GENERIC_FAILURE } from "@/lib/magic-link-user-messages";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { parseMagicLinkEmail } from "@/types/schemas/magic-link-request";

export type RequestPlayerMagicLinkResult =
  | { ok: true; emailed: boolean }
  | { ok: false; error: string };

function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function requestPlayerMagicLink(
  formData: FormData
): Promise<RequestPlayerMagicLinkResult> {
  const rid = requestId();
  const parsed = parseMagicLinkEmail(formData);
  if (!parsed) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const secret = process.env.MAGIC_AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return { ok: false, error: "Sign-in links are not configured." };
  }

  const { rows, queryError } = await getPlayerSignupsWithUpcomingGamesByEmail(parsed.email);
  if (queryError) {
    console.error(
      "[request-player-magic-link]",
      JSON.stringify({
        rid,
        stage: "verify_signups",
        message: queryError,
      })
    );
    return { ok: false, error: MAGIC_LINK_GENERIC_FAILURE };
  }

  if (rows.length === 0) {
    return { ok: true, emailed: false };
  }

  const token = createPlayerMagicLinkToken(parsed.email);
  if (!token) {
    console.error("[request-player-magic-link:error]", JSON.stringify({ rid, stage: "create_token" }));
    return { ok: false, error: MAGIC_LINK_GENERIC_FAILURE };
  }

  const origin = appOrigin().replace(/\/$/, "");
  const link = `${origin}${MAGIC_LINK_CALLBACK_PATH}?kind=player&t=${encodeURIComponent(token)}`;
  const minutes = Math.max(1, Math.round(MAGIC_LINK_TTL_MS / 60_000));
  const template = buildPlayerMagicLinkEmailTemplate({ link, minutes });

  const sent = await sendTransactionalEmailResult({
    to: parsed.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!sent.ok) {
    console.error(
      "[request-player-magic-link:error]",
      JSON.stringify({ rid, stage: "send_email", detail: sent.error })
    );
    return { ok: false, error: MAGIC_LINK_GENERIC_FAILURE };
  }

  return { ok: true, emailed: true };
}
