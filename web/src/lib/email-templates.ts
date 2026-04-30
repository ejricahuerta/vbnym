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

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type GmailConnectForPaymentSyncTemplateInput = {
  reconnectUrl: string;
  reason: "disconnect" | "payment_email_update";
};

type PaymentSignupTemplateInput = {
  gameTitle: string;
  startsAtDisplay: string;
  gameOrganizerName: string;
  playerOrganizationName: string;
  hostName: string;
  hostEmail: string;
  playerName: string;
  paymentCode: string;
  amountCents: number;
  playerCount: number;
  addedByName: string;
  refundOwnerName: string;
  deadlineMinutes: number;
  manualOnly: boolean;
};

type HostSignupNotificationTemplateInput = {
  gameTitle: string;
  startsAtDisplay: string;
  gameOrganizerName: string;
  playerOrganizationName: string;
  playerName: string;
  playerEmail: string;
  paymentCode: string;
  amountCents: number;
  playerCount: number;
  addedByName: string;
  refundOwnerName: string;
  manualOnly: boolean;
};

type PendingReminderTemplateInput = {
  gameTitle: string;
  startsAtDisplay: string;
  playerName: string;
  hostName: string;
  hostEmail: string;
  paymentCode: string;
  amountCents: number;
  remainingMinutes: number;
};

type PlayerPaymentConfirmedTemplateInput = {
  gameTitle: string;
  startsAtDisplay: string;
  playerName: string;
  hostName: string;
  hostEmail: string;
  amountCents: number;
  sourceLabel: string;
  cancellationUrl: string | null;
  canCancel: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function renderButton(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 18px;background:#f1c901;border:2px solid #111114;border-radius:6px;color:#111114;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;box-shadow:3px 3px 0 #111114;">${escapeHtml(label)}</a>`;
}

function renderLayout(input: {
  title: string;
  subtitle: string;
  contentHtml: string;
  footerText: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
  </head>
  <body style="margin:0;background:#efeae0;font-family:Archivo,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#111114;">
    <div style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fbf8f1;border:2px solid #111114;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px;background:#111114;color:#fbf8f1;border-bottom:2px solid #111114;">
            <div style="font-size:11px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;font-family:'JetBrains Mono',ui-monospace,monospace;opacity:.92;">6IX BACK</div>
            <div style="font-size:28px;font-weight:900;line-height:1;margin-top:8px;letter-spacing:-.03em;text-transform:uppercase;">
              ${escapeHtml(input.title)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 20px 12px;">
            <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#111114;">${escapeHtml(input.subtitle)}</p>
            ${input.contentHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;background:#e5dfd2;border-top:2px solid #111114;">
            <p style="margin:0;font-size:11px;line-height:1.5;color:#42424a;font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.03em;text-transform:uppercase;">
              ${escapeHtml(input.footerText)}
            </p>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

function buildMagicLinkTemplate({
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
}): { html: string; text: string } {
  const html = renderLayout({
    title,
    subtitle,
    contentHtml: `
      <p style="margin:0;font-size:13px;line-height:1.55;color:#42424a;">
        This secure link expires in about <strong>${minutes} minutes</strong>.
      </p>
      <div style="padding:18px 0 16px;">
        ${renderButton(ctaLabel, link)}
      </div>
      <p style="margin:0;font-size:12px;color:#8a8a92;line-height:1.5;">
        If the button does not work, copy and paste this URL:<br />
        <span style="word-break:break-all;color:#111114;">${escapeHtml(link)}</span>
      </p>
    `,
    footerText: "If you did not request this, you can ignore this email.",
  });
  const text = `${title}\n\n${subtitle}\n\nThis secure link expires in about ${minutes} minutes.\n${link}\n`;
  return { html, text };
}

export function buildHostMagicLinkEmailTemplate({
  link,
  minutes,
}: MagicLinkTemplateInput): MagicLinkEmailTemplate {
  const template = buildMagicLinkTemplate({
    title: "Host sign-in",
    subtitle: "Use this magic link to access your host dashboard and publish games.",
    ctaLabel: "Sign in to host",
    link,
    minutes,
  });
  return {
    subject: "Your 6IX BACK host sign-in link",
    html: template.html,
    text: template.text,
  };
}

export function buildPlayerMagicLinkEmailTemplate({
  link,
  minutes,
}: MagicLinkTemplateInput): MagicLinkEmailTemplate {
  const template = buildMagicLinkTemplate({
    title: "Player sign-in",
    subtitle: "Open your My games portal to review upcoming sessions and your payment code.",
    ctaLabel: "Open my games",
    link,
    minutes,
  });
  return {
    subject: "Your 6IX BACK games sign-in link",
    html: template.html,
    text: template.text,
  };
}

export function buildAdminMagicLinkEmailTemplate({
  link,
  minutes,
}: MagicLinkTemplateInput): MagicLinkEmailTemplate {
  const template = buildMagicLinkTemplate({
    title: "Admin sign-in",
    subtitle: "Use this magic link to open the admin control room.",
    ctaLabel: "Open admin",
    link,
    minutes,
  });
  return {
    subject: "Your 6IX BACK admin sign-in link",
    html: template.html,
    text: template.text,
  };
}

export function buildPlayerSignupPaymentEmailTemplate(input: PaymentSignupTemplateInput): EmailTemplate {
  const amount = formatMoney(input.amountCents);
  const statusLine = input.manualOnly
    ? "The host checks payments within 1 hour. If payment is not received, your spot is removed."
    : "Payment is checked automatically. If payment is not received before expiry, your spot is removed automatically.";

  return {
    subject: `Payment details for ${input.gameTitle}`,
    html: renderLayout({
      title: "Payment pending",
      subtitle: `Hi ${input.playerName}, your signup was recorded.`,
      contentHtml: `
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          ${escapeHtml(statusLine)}
        </p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          Complete payment using the steps below. Your reference code expires in ${input.deadlineMinutes} minutes from signup.
        </p>
        <ol style="margin:0 0 12px 20px;padding:0;font-size:13px;line-height:1.7;color:#111114;">
          <li>Send ${escapeHtml(amount)} by Interac to <strong>${escapeHtml(input.hostEmail)}</strong>.</li>
          <li>Use <strong>${escapeHtml(input.paymentCode)}</strong> as your transfer reference or message.</li>
          <li>Wait for your payment confirmation email.</li>
        </ol>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:2px solid #111114;border-radius:8px;background:#efeae0;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#111114;">
            <strong>Game:</strong> ${escapeHtml(input.gameTitle)}<br />
            <strong>Start:</strong> ${escapeHtml(input.startsAtDisplay)}<br />
            <strong>Presenting organizer:</strong> ${escapeHtml(input.gameOrganizerName)}<br />
            <strong>Registering under:</strong> ${escapeHtml(input.playerOrganizationName)}<br />
            <strong>Added by:</strong> ${escapeHtml(input.addedByName)}<br />
            <strong>Players:</strong> ${input.playerCount}<br />
            <strong>Refund owner:</strong> ${escapeHtml(input.refundOwnerName)}<br />
            <strong>Amount:</strong> ${escapeHtml(amount)}<br />
            <strong>Send to:</strong> ${escapeHtml(input.hostEmail)}<br />
            <strong>Reference:</strong> ${escapeHtml(input.paymentCode)}<br />
            <strong>Deadline:</strong> ${input.deadlineMinutes} minutes from signup
          </td></tr>
        </table>
      `,
      footerText: "This inbox is not monitored. For support, contact your host directly.",
    }),
    text: `Payment pending\n\nHi ${input.playerName}, your signup was recorded.\n\n${statusLine}\n\nComplete payment in 3 steps:\n1) Send ${amount} by Interac to ${input.hostEmail}\n2) Use reference code ${input.paymentCode}\n3) Wait for your payment confirmation email\n\nImportant: this reference code expires ${input.deadlineMinutes} minutes after signup.\n\nGame: ${input.gameTitle}\nStart: ${input.startsAtDisplay}\nPresenting organizer: ${input.gameOrganizerName}\nRegistering under: ${input.playerOrganizationName}\nAdded by: ${input.addedByName}\nPlayers: ${input.playerCount}\nRefund owner: ${input.refundOwnerName}\nAmount: ${amount}\nSend to: ${input.hostEmail}\nReference: ${input.paymentCode}\nDeadline: ${input.deadlineMinutes} minutes from signup\nHost: ${input.hostName}\n\nThis inbox is not monitored. Contact your host directly for support.\n`,
  };
}

export function buildHostSignupNotificationEmailTemplate(input: HostSignupNotificationTemplateInput): EmailTemplate {
  const amount = formatMoney(input.amountCents);
  return {
    subject: `New pending signup: ${input.playerName}`,
    html: renderLayout({
      title: "New player signup",
      subtitle: `${input.playerName} just joined ${input.gameTitle}.`,
      contentHtml: `
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          ${input.manualOnly ? "This game is manual-only for payment confirmation." : "This game is connected to Gmail sync for auto-matching."}
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:2px solid #111114;border-radius:8px;background:#efeae0;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#111114;">
            <strong>Player:</strong> ${escapeHtml(input.playerName)} (${escapeHtml(input.playerEmail)})<br />
            <strong>Game:</strong> ${escapeHtml(input.gameTitle)}<br />
            <strong>Start:</strong> ${escapeHtml(input.startsAtDisplay)}<br />
            <strong>Players:</strong> ${input.playerCount}<br />
            <strong>Added by:</strong> ${escapeHtml(input.addedByName)}<br />
            <strong>Refund owner:</strong> ${escapeHtml(input.refundOwnerName)}<br />
            <strong>Amount:</strong> ${escapeHtml(amount)}<br />
            <strong>Reference:</strong> ${escapeHtml(input.paymentCode)}
          </td></tr>
        </table>
      `,
      footerText: "Use host dashboard filters to keep pending payments moving.",
    }),
    text: `New player signup\n\n${input.playerName} (${input.playerEmail}) joined ${input.gameTitle}.\nStart: ${input.startsAtDisplay}\nPresenting organizer: ${input.gameOrganizerName}\nRegistering under: ${input.playerOrganizationName}\nPlayers: ${input.playerCount}\nAdded by: ${input.addedByName}\nRefund owner: ${input.refundOwnerName}\nAmount: ${amount}\nReference: ${input.paymentCode}\n`,
  };
}

export function buildPlayerPendingReminderEmailTemplate(input: PendingReminderTemplateInput): EmailTemplate {
  const amount = formatMoney(input.amountCents);
  return {
    subject: `Reminder: payment still pending for ${input.gameTitle}`,
    html: renderLayout({
      title: "Payment reminder",
      subtitle: `Hi ${input.playerName}, your payment is still pending.`,
      contentHtml: `
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          We still need your Interac transfer to hold your spot. This pending signup can expire if payment is not received in time.
        </p>
        <ol style="margin:0 0 12px 20px;padding:0;font-size:13px;line-height:1.7;color:#111114;">
          <li>Send ${escapeHtml(amount)} by Interac to <strong>${escapeHtml(input.hostEmail)}</strong>.</li>
          <li>Use <strong>${escapeHtml(input.paymentCode)}</strong> as your transfer reference or message.</li>
          <li>Complete payment within about ${input.remainingMinutes} minutes.</li>
        </ol>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          After payment, your status is confirmed by the system or host.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:2px solid #111114;border-radius:8px;background:#efeae0;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#111114;">
            <strong>Game:</strong> ${escapeHtml(input.gameTitle)}<br />
            <strong>Start:</strong> ${escapeHtml(input.startsAtDisplay)}<br />
            <strong>Amount:</strong> ${escapeHtml(amount)}<br />
            <strong>Send to:</strong> ${escapeHtml(input.hostEmail)}<br />
            <strong>Reference:</strong> ${escapeHtml(input.paymentCode)}<br />
            <strong>Time remaining:</strong> about ${input.remainingMinutes} minutes
          </td></tr>
        </table>
      `,
      footerText: "This inbox is not monitored. Contact your host directly for support.",
    }),
    text: `Payment reminder\n\nHi ${input.playerName}, your payment is still pending.\n\nComplete payment in 3 steps:\n1) Send ${amount} by Interac to ${input.hostEmail}\n2) Use reference code ${input.paymentCode}\n3) Complete payment within about ${input.remainingMinutes} minutes\n\nGame: ${input.gameTitle}\nStart: ${input.startsAtDisplay}\nAmount: ${amount}\nSend to: ${input.hostEmail}\nReference: ${input.paymentCode}\nTime remaining: about ${input.remainingMinutes} minutes\n\nThis inbox is not monitored. Contact your host directly for support.\n`,
  };
}

export function buildHostPendingReminderEmailTemplate(input: PendingReminderTemplateInput): EmailTemplate {
  const amount = formatMoney(input.amountCents);
  return {
    subject: `Pending payment reminder: ${input.playerName}`,
    html: renderLayout({
      title: "Pending player reminder",
      subtitle: `${input.playerName} is still pending for ${input.gameTitle}.`,
      contentHtml: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:2px solid #111114;border-radius:8px;background:#efeae0;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#111114;">
            <strong>Player:</strong> ${escapeHtml(input.playerName)}<br />
            <strong>Game:</strong> ${escapeHtml(input.gameTitle)}<br />
            <strong>Start:</strong> ${escapeHtml(input.startsAtDisplay)}<br />
            <strong>Amount:</strong> ${escapeHtml(amount)}<br />
            <strong>Reference:</strong> ${escapeHtml(input.paymentCode)}<br />
            <strong>Time remaining:</strong> about ${input.remainingMinutes} minutes
          </td></tr>
        </table>
      `,
      footerText: "You can manually reconcile in Host dashboard if needed.",
    }),
    text: `Pending player reminder\n\nPlayer: ${input.playerName}\nGame: ${input.gameTitle}\nStart: ${input.startsAtDisplay}\nAmount: ${amount}\nReference: ${input.paymentCode}\nTime remaining: about ${input.remainingMinutes} minutes\n`,
  };
}

export function buildPlayerPaymentConfirmedEmailTemplate(input: PlayerPaymentConfirmedTemplateInput): EmailTemplate {
  const amount = formatMoney(input.amountCents);
  const cancellationLine = input.canCancel
    ? "Need to cancel? Use your unique cancel link below. It expires 2 hours before game start. After cancellation, the host refunds your payment as soon as possible."
    : "Cancellation is closed within 2 hours of game start.";
  return {
    subject: `Payment confirmed for ${input.gameTitle}`,
    html: renderLayout({
      title: "Payment confirmed",
      subtitle: `Hi ${input.playerName}, your spot is confirmed.`,
      contentHtml: `
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          Your payment was confirmed by ${escapeHtml(input.sourceLabel)}.
        </p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          ${escapeHtml(cancellationLine)}
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:2px solid #111114;border-radius:8px;background:#efeae0;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#111114;">
            <strong>Game:</strong> ${escapeHtml(input.gameTitle)}<br />
            <strong>Start:</strong> ${escapeHtml(input.startsAtDisplay)}<br />
            <strong>Amount:</strong> ${escapeHtml(amount)}<br />
            <strong>Host:</strong> ${escapeHtml(input.hostName)} (${escapeHtml(input.hostEmail)})
          </td></tr>
        </table>
        ${
          input.canCancel && input.cancellationUrl
            ? `<div style="padding:16px 0 0;">${renderButton("Cancel signup", input.cancellationUrl)}</div>`
            : ""
        }
      `,
      footerText: "You are all set. See you at the run.",
    }),
    text: `Payment confirmed\n\nHi ${input.playerName}, your spot is confirmed.\nConfirmed by: ${input.sourceLabel}\n${cancellationLine}\nGame: ${input.gameTitle}\nStart: ${input.startsAtDisplay}\nAmount: ${amount}\nHost: ${input.hostName} (${input.hostEmail})\n${input.canCancel && input.cancellationUrl ? `Cancel signup: ${input.cancellationUrl}\n` : ""}`,
  };
}

export function buildGmailReconnectReminderEmailTemplate(input: { reconnectUrl: string; expiresAtText: string; scopeLabel: string }): EmailTemplate {
  return {
    subject: `Reconnect Gmail for ${input.scopeLabel}`,
    html: renderLayout({
      title: "Reconnect Gmail",
      subtitle: `${input.scopeLabel} Gmail access may expire by ${input.expiresAtText}.`,
      contentHtml: `<div style="padding:8px 0 2px;">${renderButton("Reconnect Gmail", input.reconnectUrl)}</div>`,
      footerText: "Reconnect to keep automated payment sync running.",
    }),
    text: `Reconnect Gmail for ${input.scopeLabel}\n\nMay expire by ${input.expiresAtText}.\nReconnect: ${input.reconnectUrl}\n`,
  };
}

export function buildGmailConnectForPaymentSyncEmailTemplate(
  input: GmailConnectForPaymentSyncTemplateInput
): EmailTemplate {
  const reasonText =
    input.reason === "disconnect"
      ? "You disconnected Gmail from your host account."
      : "You updated your payment email for a hosted game.";
  return {
    subject: "Connect Gmail for payment sync",
    html: renderLayout({
      title: "Connect Gmail",
      subtitle: "Keep payment sync active for your hosted games.",
      contentHtml: `
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          ${escapeHtml(reasonText)}
        </p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          Connect Gmail again so payment sync can continue matching transfers for your player signups.
        </p>
        <div style="padding:8px 0 2px;">${renderButton("Connect Gmail", input.reconnectUrl)}</div>
      `,
      footerText: "You can manage Gmail sync from your host dashboard.",
    }),
    text: `Connect Gmail for payment sync\n\n${reasonText}\nConnect Gmail again so payment sync can continue matching transfers.\nReconnect: ${input.reconnectUrl}\n`,
  };
}

export function buildGmailConnectedEmailTemplate(input: { dashboardUrl: string }): EmailTemplate {
  return {
    subject: "Gmail connected for payment sync",
    html: renderLayout({
      title: "Gmail connected",
      subtitle: "Payment sync is now active for your hosted games.",
      contentHtml: `
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#42424a;">
          Your Gmail is connected. Incoming Interac transfers will be matched to your player signups automatically.
        </p>
        <div style="padding:8px 0 2px;">${renderButton("Open host dashboard", input.dashboardUrl)}</div>
      `,
      footerText: "You can manage Gmail sync from your host dashboard.",
    }),
    text: `Gmail connected for payment sync\n\nPayment sync is now active for your hosted games. Incoming Interac transfers will be matched to your player signups automatically.\nOpen host dashboard: ${input.dashboardUrl}\n`,
  };
}
