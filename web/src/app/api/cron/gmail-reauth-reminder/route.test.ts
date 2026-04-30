import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, readJson } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  sendGmailReauthReminder: vi.fn(),
}));

vi.mock("@/lib/gmail-reauth-reminder", () => ({
  sendGmailReauthReminder: mocks.sendGmailReauthReminder,
}));

import { GET, POST } from "./route";

describe("api/cron/gmail-reauth-reminder", () => {
  beforeEach(() => {
    mocks.sendGmailReauthReminder.mockReset();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 401 when unauthorized", async () => {
    const response = await GET(buildRequest({ url: "http://localhost/api/cron/gmail-reauth-reminder" }));
    const body = await readJson<{ ok: boolean; error: string }>(response);
    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "Unauthorized" });
  });

  it("returns reminder payload on success", async () => {
    mocks.sendGmailReauthReminder.mockResolvedValueOnce({
      ok: true,
      sent: 2,
      skipped: "sent",
    });
    const response = await POST(
      buildRequest({
        url: "http://localhost/api/cron/gmail-reauth-reminder",
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await readJson<{ ok: boolean; sent: number; skipped: string }>(response);
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sent).toBe(2);
    expect(body.skipped).toBe("sent");
  });

  it("returns 500 when reminder send throws", async () => {
    mocks.sendGmailReauthReminder.mockRejectedValueOnce(new Error("reauth failed"));
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/cron/gmail-reauth-reminder",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await readJson<{ ok: boolean; error: string }>(response);
    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "reauth failed" });
  });
});
