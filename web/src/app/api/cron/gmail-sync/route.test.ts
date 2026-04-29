import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, readJson } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  syncPaidSignupsFromGmail: vi.fn(),
}));

vi.mock("@/lib/gmail", () => ({
  syncPaidSignupsFromGmail: mocks.syncPaidSignupsFromGmail,
}));

import { GET, POST } from "./route";

describe("api/cron/gmail-sync", () => {
  beforeEach(() => {
    mocks.syncPaidSignupsFromGmail.mockReset();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await GET(buildRequest({ url: "http://localhost/api/cron/gmail-sync" }));
    const body = await readJson<{ ok: boolean; error: string }>(response);
    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "Unauthorized" });
  });

  it("returns sync result when authorized", async () => {
    mocks.syncPaidSignupsFromGmail.mockResolvedValueOnce({ matched: 3, expired: 1, reminded: 2 });
    const response = await POST(
      buildRequest({
        url: "http://localhost/api/cron/gmail-sync",
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await readJson<{ ok: boolean; matched: number; expired: number; reminded: number }>(response);
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, matched: 3, expired: 1, reminded: 2 });
  });

  it("returns 400 when sync throws", async () => {
    mocks.syncPaidSignupsFromGmail.mockRejectedValueOnce(new Error("boom"));
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/cron/gmail-sync",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await readJson<{ ok: boolean; error: string }>(response);
    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "boom" });
  });
});
