type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text body for mail clients and easy copy/paste of codes. */
  text?: string;
};

type ResendEmailResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

export async function sendTransactionalEmail(input: SendEmailInput): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "NYM Volleyball <nymvb@ednsy.com>";
  if (!resendKey) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
    });
    const payload = (await response.json()) as ResendEmailResponse;
    if (!response.ok || payload.error) {
      console.error(payload.error?.message ?? "Could not send transactional email.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed.";
    console.error(message);
  }
}
