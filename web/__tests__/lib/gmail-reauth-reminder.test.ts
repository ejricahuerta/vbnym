import { afterEach, describe, expect, it, vi } from "vitest";

const sendTransactionalEmail = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/notifications", () => ({
  sendTransactionalEmail: (...a: unknown[]) => sendTransactionalEmail(...a),
}));

describe("maybeSendGmailReauthReminder", () => {
  afterEach(() => {
    delete process.env.GMAIL_OAUTH_REFRESH_VALID_DAYS;
    delete process.env.GMAIL_REAUTH_REMINDER_LEAD_DAYS;
    delete process.env.ADMIN_EMAILS;
    vi.restoreAllMocks();
  });

  it("skips when no Gmail refresh token", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { gmail_refresh_token: null },
              error: null,
            }),
          }),
        }),
      })),
    };
    const { maybeSendGmailReauthReminder } = await import("@/lib/gmail-reauth-reminder");
    const r = await maybeSendGmailReauthReminder(admin as never, "http://localhost");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.skipped).toBe("no_gmail_connected");
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("skips when outside reminder window", async () => {
    const farFuture = new Date(Date.now() + 400 * 86400000).toISOString();
    const admin = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                gmail_refresh_token: "rt",
                gmail_connected_email: "a@b.com",
                gmail_connected_at: new Date().toISOString(),
                gmail_assumed_expires_at: farFuture,
                gmail_reauth_reminder_sent_for_expires_at: null,
              },
              error: null,
            }),
          }),
        }),
      })),
    };
    const { maybeSendGmailReauthReminder } = await import("@/lib/gmail-reauth-reminder");
    const r = await maybeSendGmailReauthReminder(admin as never, "http://localhost");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.skipped).toBe("outside_reminder_window");
  });

  it("sends when inside lead window and updates reminder marker", async () => {
    process.env.GMAIL_OAUTH_REFRESH_VALID_DAYS = "1";
    process.env.GMAIL_REAUTH_REMINDER_LEAD_DAYS = "7";
    process.env.ADMIN_EMAILS = "boss@example.com";
    const assumedExpires = new Date(Date.now() + 2 * 86400000).toISOString();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    let adminSettingsFrom = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== "admin_settings") throw new Error(table);
        adminSettingsFrom += 1;
        if (adminSettingsFrom === 1) {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    gmail_refresh_token: "rt",
                    gmail_connected_email: "inbox@test.com",
                    gmail_connected_at: new Date(Date.now() - 86400000).toISOString(),
                    gmail_assumed_expires_at: assumedExpires,
                    gmail_reauth_reminder_sent_for_expires_at: null,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          update: () => ({ eq: updateEq }),
        };
      }),
    };
    const { maybeSendGmailReauthReminder } = await import("@/lib/gmail-reauth-reminder");
    const r = await maybeSendGmailReauthReminder(admin as never, "http://localhost:3000");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sent).toBeGreaterThanOrEqual(1);
      expect(r.skipped).toBe("sent");
    }
    expect(sendTransactionalEmail).toHaveBeenCalled();
    expect(updateEq).toHaveBeenCalled();
  });
});

describe("gmailAssumedExpiresAfterConnect", () => {
  afterEach(() => {
    delete process.env.GMAIL_OAUTH_REFRESH_VALID_DAYS;
  });

  it("adds configured validity days", async () => {
    process.env.GMAIL_OAUTH_REFRESH_VALID_DAYS = "10";
    const { gmailAssumedExpiresAfterConnect } = await import("@/lib/gmail-reauth-reminder");
    const base = new Date("2026-01-01T12:00:00.000Z");
    const iso = gmailAssumedExpiresAfterConnect(base);
    const end = new Date(iso).getTime();
    expect(end - base.getTime()).toBe(10 * 86400000);
  });
});
