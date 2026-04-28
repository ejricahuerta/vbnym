type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** Resend success body includes `id`; errors use root-level `message` per https://resend.com/docs/api-reference/errors */
type ResendEmailSuccessBody = {
  id?: string;
};

type ResendEmailErrorBody = {
  message?: string;
  name?: string;
  statusCode?: number;
  /** Legacy/alternate nesting some clients use */
  error?: {
    message?: string;
  };
};

function extractResendErrorMessage(
  payload: ResendEmailSuccessBody & ResendEmailErrorBody,
  httpStatus: number,
  rawBodySnippet: string
): string {
  const fromNested = payload.error?.message?.trim();
  if (fromNested) return fromNested;
  const fromRoot = typeof payload.message === "string" ? payload.message.trim() : "";
  if (fromRoot) return fromRoot;
  if (!httpStatus || httpStatus >= 500) {
    return `Email provider error (HTTP ${httpStatus || "?"}). Try again later.`;
  }
  return rawBodySnippet.length > 0
    ? `Could not send email (HTTP ${httpStatus}): ${rawBodySnippet.slice(0, 200)}`
    : `Could not send transactional email (HTTP ${httpStatus}).`;
}

export async function sendTransactionalEmailResult(
  input: SendEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "6IX BACK <noreply@6ixback.com>";
  if (!resendKey) {
    console.error("[send-email]", JSON.stringify({ stage: "missing_resend_api_key", message: "RESEND_API_KEY unset" }));
    return { ok: false, error: "Email is not configured (missing RESEND_API_KEY)." };
  }

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

    const rawText = await response.text();
    let payload: ResendEmailSuccessBody & ResendEmailErrorBody = {};
    try {
      if (rawText) {
        payload = JSON.parse(rawText) as ResendEmailSuccessBody & ResendEmailErrorBody;
      }
    } catch {
      payload = {};
    }

    const hasSuccessId = Boolean(payload.id);
    if (response.ok && hasSuccessId) {
      return { ok: true };
    }

    const msg = extractResendErrorMessage(payload, response.status, rawText.trim());
    console.error(
      "[send-email:error]",
      JSON.stringify({
        stage: "resend_api_error",
        httpStatus: response.status,
        ok: response.ok,
        resendName: payload.name,
        resendStatusCode: payload.statusCode,
        message: msg,
        subject: input.subject,
        toDomain: input.to.includes("@") ? input.to.split("@")[1] : null,
        rawSnippet: rawText.slice(0, 500),
      })
    );
    return { ok: false, error: msg };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed.";
    console.error(
      "[send-email:error]",
      JSON.stringify({ stage: "fetch_exception", message, stack: error instanceof Error ? error.stack : undefined })
    );
    return { ok: false, error: message };
  }
}
