/**
 * Test script — sends a mock Interac e-transfer "Funds Deposited" email
 * via Resend, styled to match a real Interac receipt.
 *
 * Usage:  node --env-file=.env ../scripts/test-etransfer-email.mjs
 *   (run from the web/ directory so .env is picked up)
 */

const TO = "exricahuerta@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL ?? "NYM Volleyball <nymvb@ednsy.com>";

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set. Aborting.");
  process.exit(1);
}

const now = new Date();
const formattedDate = now.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const transfer = {
  senderName: "Edmel Ricahuerta",
  amount: "5.00",
  currency: "CAD",
  message: "NYM-A24-H5H",
  date: formattedDate,
  referenceNumber: "C1ASUTauMVE2",
  bank: "Scotiabank",
  accountEnding: "2024",
};

const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#e5e5e5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">

<!-- outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e5e5e5">
<tr><td align="center" style="padding:24px 12px">

<!-- card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <!-- header bar -->
  <tr>
    <td style="background:#1a1a1a;padding:16px 24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="display:inline-block;background:#f5a623;color:#1a1a1a;font-weight:900;font-size:14px;padding:5px 10px;border-radius:6px;font-family:Arial,sans-serif;letter-spacing:-0.3px">
              Interac
            </span>
          </td>
          <td align="right" style="color:#ffffff;font-size:13px">
            <a href="#" style="color:#ffffff;text-decoration:underline;margin-right:12px">View in browser</a>
            <span style="color:#888;margin-right:8px">|</span>
            <a href="#" style="color:#ffffff;text-decoration:none">FR</a>
            <span style="display:inline-block;width:22px;height:22px;border:1.5px solid #888;border-radius:50%;text-align:center;line-height:20px;font-size:13px;color:#888;margin-left:8px;vertical-align:middle">?</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- body -->
  <tr>
    <td style="padding:32px 32px 8px">
      <p style="margin:0 0 4px;font-size:15px;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">
        Hi ${transfer.senderName.toUpperCase()},
      </p>
      <h1 style="margin:0 0 8px;font-size:28px;color:#1a1a1a;font-weight:800">Funds Deposited!</h1>
      <p style="margin:0 0 12px;font-size:36px;color:#1a1a1a;font-weight:800">$${transfer.amount}</p>
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.5">
        Your funds have been automatically deposited into your account at <strong>${transfer.bank}</strong>.
      </p>
    </td>
  </tr>

  <!-- bank badge -->
  <tr>
    <td style="padding:0 32px 20px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:10px;padding:12px 16px;width:100%">
        <tr>
          <td width="40" valign="middle">
            <div style="width:34px;height:34px;background:#d91e36;border-radius:8px;text-align:center;line-height:34px;color:#fff;font-weight:900;font-size:16px">S</div>
          </td>
          <td valign="middle" style="padding-left:10px">
            <div style="font-size:15px;font-weight:700;color:#1a1a1a">${transfer.bank}</div>
            <div style="font-size:13px;color:#777">Account ending in ${transfer.accountEnding}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- transfer details -->
  <tr>
    <td style="padding:0 32px 32px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:10px;padding:20px;width:100%">
        <tr>
          <td colspan="2" style="padding-bottom:14px">
            <strong style="font-size:16px;color:#1a1a1a">Transfer Details</strong>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;width:50%">
            <div style="font-size:12px;color:#999;margin-bottom:2px">Message:</div>
            <div style="font-size:15px;color:#1a1a1a;font-weight:700">${transfer.message}</div>
          </td>
          <td style="padding-bottom:12px;vertical-align:top">
          </td>
        </tr>

        <!-- Date / Reference -->
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;width:50%">
            <div style="font-size:12px;color:#999;margin-bottom:2px">Date:</div>
            <div style="font-size:14px;color:#1a1a1a">${transfer.date}</div>
          </td>
          <td style="padding-bottom:12px;vertical-align:top">
            <div style="font-size:12px;color:#999;margin-bottom:2px">Reference Number:</div>
            <div style="font-size:14px;color:#1a1a1a">${transfer.referenceNumber}</div>
          </td>
        </tr>

        <!-- Sent From / Amount -->
        <tr>
          <td style="vertical-align:top;width:50%">
            <div style="font-size:12px;color:#999;margin-bottom:2px">Sent From:</div>
            <div style="font-size:14px;color:#1a1a1a">${transfer.senderName}</div>
          </td>
          <td style="vertical-align:top">
            <div style="font-size:12px;color:#999;margin-bottom:2px">Amount:</div>
            <div style="font-size:14px;color:#1a1a1a">$${transfer.amount} (${transfer.currency})</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
<!-- /card -->

</td></tr>
</table>
<!-- /outer wrapper -->

</body>
</html>
`;

async function main() {
  console.log(`Sending mock Interac e-transfer receipt to ${TO} …`);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject: "INTERAC e-Transfer: $5.00 (CAD) has been deposited",
      html,
    }),
  });

  const payload = await res.json();

  if (!res.ok || payload.error) {
    console.error("Failed:", payload.error?.message ?? JSON.stringify(payload));
    process.exit(1);
  }

  console.log("Sent successfully. Resend ID:", payload.id);
}

main();
