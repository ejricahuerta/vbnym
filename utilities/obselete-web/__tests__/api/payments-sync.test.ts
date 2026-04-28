import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/payments/sync/route";

const notifyAndCleanExpiredHolds = vi.hoisted(() => vi.fn().mockResolvedValue(2));
const syncPaidSignupsFromGmail = vi.hoisted(() => vi.fn().mockResolvedValue(3));

vi.mock("@/lib/hold-expiry", () => ({ notifyAndCleanExpiredHolds }));
vi.mock("@/lib/gmail-sync", () => ({ syncPaidSignupsFromGmail }));

const createAdminClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

const createClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

describe("POST /api/admin/payments/sync", () => {
  it("runs sync with valid cron token", async () => {
    process.env.PAYMENT_SYNC_CRON_TOKEN = "tok";
    createAdminClient.mockReturnValue({});
    const req = new NextRequest("http://localhost/api/admin/payments/sync", {
      method: "POST",
      headers: { "x-cron-token": "tok" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, matched: 3, expired: 2 });
    delete process.env.PAYMENT_SYNC_CRON_TOKEN;
  });

  it("returns 403 for non-admin without cron token", async () => {
    delete process.env.PAYMENT_SYNC_CRON_TOKEN;
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = new NextRequest("http://localhost/api/admin/payments/sync", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
