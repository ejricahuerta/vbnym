export interface Env {
  PAYMENT_SYNC_ENDPOINT: string;
  GMAIL_REAUTH_REMINDER_ENDPOINT: string;
  PAYMENT_SYNC_CRON_TOKEN: string;
}

async function runSync(env: Env): Promise<void> {
  const response = await fetch(env.PAYMENT_SYNC_ENDPOINT, {
    method: "POST",
    headers: {
      "x-cron-token": env.PAYMENT_SYNC_CRON_TOKEN,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Sync failed (${response.status}): ${text}`);
  }
  console.log(`Payment sync success: ${text}`);
}

async function runGmailReauthReminder(env: Env): Promise<void> {
  if (!env.GMAIL_REAUTH_REMINDER_ENDPOINT) return;
  const response = await fetch(env.GMAIL_REAUTH_REMINDER_ENDPOINT, {
    method: "POST",
    headers: {
      "x-cron-token": env.PAYMENT_SYNC_CRON_TOKEN,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail reauth reminder failed (${response.status}): ${text}`);
  }
  console.log(`Gmail reauth reminder success: ${text}`);
}

function isNoonUtc(scheduledTimeMs: number): boolean {
  const d = new Date(scheduledTimeMs);
  return d.getUTCHours() === 12 && d.getUTCMinutes() === 0;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    await runSync(env);
    if (isNoonUtc(controller.scheduledTime)) {
      await runGmailReauthReminder(env);
    }
  },

  async fetch(_request: Request, env: Env): Promise<Response> {
    try {
      await runSync(env);
      return new Response("ok", { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(message, { status: 500 });
    }
  },
};
