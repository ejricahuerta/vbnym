import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, readJson } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  syncPaidSignupsFromGmail: vi.fn(),
  isAdminAuthorized: vi.fn(),
}));

vi.mock("@/lib/gmail", () => ({
  syncPaidSignupsFromGmail: mocks.syncPaidSignupsFromGmail,
}));

vi.mock("@/lib/auth", () => ({
  isAdminAuthorized: mocks.isAdminAuthorized,
}));

import { POST } from "./route";

describe("api/admin/payments/sync", () => {
  beforeEach(() => {
    mocks.syncPaidSignupsFromGmail.mockReset();
    mocks.isAdminAuthorized.mockReset();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 403 when not cron-authorized and not admin", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(false);
    const response = await POST(buildRequest({ url: "http://localhost/api/admin/payments/sync", method: "POST" }));
    const body = await readJson<{ ok: boolean; error: string }>(response);
    expect(response.status).toBe(403);
    expect(body).toEqual({ ok: false, error: "Only admins can trigger payment sync." });
  });

  it("allows cron auth without admin session", async () => {
    mocks.syncPaidSignupsFromGmail.mockResolvedValueOnce({ matched: 2, expired: 0, reminded: 1 });
    const response = await POST(
      buildRequest({
        url: "http://localhost/api/admin/payments/sync",
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await readJson<{ ok: boolean; matched: number; expired: number; reminded: number }>(response);
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, matched: 2, expired: 0, reminded: 1 });
    expect(mocks.isAdminAuthorized).not.toHaveBeenCalled();
  });

  it("allows admin session when cron header missing", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(true);
    mocks.syncPaidSignupsFromGmail.mockResolvedValueOnce({ matched: 1, expired: 1, reminded: 0 });
    const response = await POST(buildRequest({ url: "http://localhost/api/admin/payments/sync", method: "POST" }));
    const body = await readJson<{ ok: boolean; matched: number; expired: number; reminded: number }>(response);
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, matched: 1, expired: 1, reminded: 0 });
  });

  it("returns 400 when sync throws", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(true);
    mocks.syncPaidSignupsFromGmail.mockRejectedValueOnce(new Error("sync failed"));
    const response = await POST(buildRequest({ url: "http://localhost/api/admin/payments/sync", method: "POST" }));
    const body = await readJson<{ ok: boolean; error: string }>(response);
    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "sync failed" });
  });
});
