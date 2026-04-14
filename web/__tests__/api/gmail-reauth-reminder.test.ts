import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/cron/gmail-reauth-reminder/route";

const maybeSendGmailReauthReminder = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ ok: true, sent: 1, skipped: "sent" })
);
vi.mock("@/lib/gmail-reauth-reminder", () => ({ maybeSendGmailReauthReminder }));

const createAdminClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

describe("POST /api/cron/gmail-reauth-reminder", () => {
  it("returns 401 when cron token missing or wrong", async () => {
    process.env.PAYMENT_SYNC_CRON_TOKEN = "secret";
    const missing = new NextRequest("http://localhost/api/cron/gmail-reauth-reminder", {
      method: "POST",
    });
    expect((await POST(missing)).status).toBe(401);
    const wrong = new NextRequest("http://localhost/api/cron/gmail-reauth-reminder", {
      method: "POST",
      headers: { "x-cron-token": "wrong" },
    });
    expect((await POST(wrong)).status).toBe(401);
    delete process.env.PAYMENT_SYNC_CRON_TOKEN;
  });

  it("calls reminder on valid token", async () => {
    process.env.PAYMENT_SYNC_CRON_TOKEN = "ok";
    createAdminClient.mockReturnValue({});
    const req = new NextRequest("http://localhost/api/cron/gmail-reauth-reminder", {
      method: "POST",
      headers: { "x-cron-token": "ok" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(maybeSendGmailReauthReminder).toHaveBeenCalled();
    delete process.env.PAYMENT_SYNC_CRON_TOKEN;
  });
});
