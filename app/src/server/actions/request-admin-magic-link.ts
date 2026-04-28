'use server';

import { isAdminEmail } from "@/lib/admin-emails";
import { buildAdminMagicLinkEmailTemplate } from "@/lib/email-templates";
import { appOrigin } from "@/lib/env";
import { MAGIC_LINK_TTL_MS } from "@/lib/magic-auth-cookies";
import { MAGIC_LINK_CALLBACK_PATH } from "@/lib/magic-link-callback";
import { createAdminMagicLinkToken } from "@/lib/magic-link";
import { MAGIC_LINK_GENERIC_FAILURE } from "@/lib/magic-link-user-messages";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { parseMagicLinkEmail } from "@/types/schemas/magic-link-request";

export type RequestAdminMagicLinkResult = { ok: true } | { ok: false; error: string };

export async function requestAdminMagicLink(formData: FormData): Promise<RequestAdminMagicLinkResult> {
  const parsed = parseMagicLinkEmail(formData);
  if (!parsed) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const secret = process.env.MAGIC_AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    console.error("[request-admin-magic-link:error]", JSON.stringify({ stage: "magic_auth_secret" }));
    return { ok: false, error: MAGIC_LINK_GENERIC_FAILURE };
  }

  if (!isAdminEmail(parsed.email)) {
    return { ok: true };
  }

  const token = createAdminMagicLinkToken(parsed.email);
  if (!token) {
    console.error("[request-admin-magic-link:error]", JSON.stringify({ stage: "create_token" }));
    return { ok: false, error: MAGIC_LINK_GENERIC_FAILURE };
  }

  const origin = appOrigin().replace(/\/$/, "");
  const link = `${origin}${MAGIC_LINK_CALLBACK_PATH}?kind=admin&t=${encodeURIComponent(token)}`;
  const minutes = Math.max(1, Math.round(MAGIC_LINK_TTL_MS / 60_000));
  const template = buildAdminMagicLinkEmailTemplate({ link, minutes });

  const sent = await sendTransactionalEmailResult({
    to: parsed.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!sent.ok) {
    console.error(
      "[request-admin-magic-link:error]",
      JSON.stringify({ stage: "send_email", detail: sent.error })
    );
    return { ok: false, error: MAGIC_LINK_GENERIC_FAILURE };
  }

  return { ok: true };
}
