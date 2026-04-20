import { afterEach, describe, expect, it } from "vitest";
import { broadcastPlayerPolicyUpdate } from "@/server/actions/admin-policy-broadcast";

describe("broadcastPlayerPolicyUpdate", () => {
  const prev = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (prev === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prev;
  });

  it("returns error when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const r = await broadcastPlayerPolicyUpdate(false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/RESEND_API_KEY/i);
  });
});
