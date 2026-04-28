import "server-only";

type MagicLinkTemplateInput = {
  link: string;
  minutes: number;
};

type MagicLinkEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function baseMagicHtml({
  title,
  subtitle,
  ctaLabel,
  link,
  minutes,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  link: string;
  minutes: number;
}): string {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeLink = escapeHtml(link);

  return `
  <div style="background:#efeae0;padding:24px 12px;font-family:Archivo,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#111114;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fbf8f1;border:2px solid #111114;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:18px 20px;background:#111114;color:#fbf8f1;border-bottom:2px solid #111114;">
          <div style="font-size:11px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;font-family:'JetBrains Mono',ui-monospace,monospace;opacity:.92;">6IX BACK</div>
          <div style="font-size:28px;font-weight:900;line-height:1;margin-top:8px;letter-spacing:-.03em;text-transform:uppercase;">
            ${safeTitle}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 20px 12px;">
          <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#111114;">${safeSubtitle}</p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:#42424a;">
            This secure link expires in about <strong>${minutes} minutes</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 20px 16px;">
          <a href="${safeLink}" style="display:inline-block;padding:12px 18px;background:#f1c901;border:2px solid #111114;border-radius:6px;color:#111114;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;box-shadow:3px 3px 0 #111114;">
            ${safeCtaLabel}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 18px;">
          <p style="margin:0;font-size:12px;color:#8a8a92;line-height:1.5;">
            If the button does not work, copy and paste this URL:<br />
            <span style="word-break:break-all;color:#111114;">${safeLink}</span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;background:#e5dfd2;border-top:2px solid #111114;">
          <p style="margin:0;font-size:11px;line-height:1.5;color:#42424a;font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.03em;text-transform:uppercase;">
            If you did not request this, you can ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

export function buildHostMagicLinkEmailTemplate({
  link,
  minutes,
}: MagicLinkTemplateInput): MagicLinkEmailTemplate {
  return {
    subject: "Your 6IX BACK host sign-in link",
    html: baseMagicHtml({
      title: "Host sign-in",
      subtitle: "Use this magic link to access your host dashboard and publish games.",
      ctaLabel: "Sign in to host",
      link,
      minutes,
    }),
    text: `6IX BACK host sign-in (expires in about ${minutes} minutes):\n${link}\n`,
  };
}

export function buildPlayerMagicLinkEmailTemplate({
  link,
  minutes,
}: MagicLinkTemplateInput): MagicLinkEmailTemplate {
  return {
    subject: "Your 6IX BACK games sign-in link",
    html: baseMagicHtml({
      title: "Player sign-in",
      subtitle: "Open your My games portal to review upcoming sessions and your payment code.",
      ctaLabel: "Open my games",
      link,
      minutes,
    }),
    text: `6IX BACK My games sign-in (expires in about ${minutes} minutes):\n${link}\n`,
  };
}

export function buildAdminMagicLinkEmailTemplate({
  link,
  minutes,
}: MagicLinkTemplateInput): MagicLinkEmailTemplate {
  return {
    subject: "Your 6IX BACK admin sign-in link",
    html: baseMagicHtml({
      title: "Admin sign-in",
      subtitle: "Use this magic link to open the admin control room.",
      ctaLabel: "Open admin",
      link,
      minutes,
    }),
    text: `6IX BACK admin sign-in (expires in about ${minutes} minutes):\n${link}\n`,
  };
}
