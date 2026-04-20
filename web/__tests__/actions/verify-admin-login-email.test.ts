import { afterEach, describe, expect, it } from "vitest";
import { verifyAdminLoginEmail } from "@/server/actions/verify-admin-login-email";

function fd(email: string) {
  const f = new FormData();
  f.append("email", email);
  return f;
}

describe("verifyAdminLoginEmail", () => {
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it("rejects invalid email shape", async () => {
    const r = await verifyAdminLoginEmail(fd("not-an-email"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/valid email/i);
  });

  it("allows @ednsy.com", async () => {
    const r = await verifyAdminLoginEmail(fd("Ops@EdnSy.CoM"));
    expect(r.ok).toBe(true);
  });

  it("allows exact ADMIN_EMAILS entry", async () => {
    process.env.ADMIN_EMAILS = "host@example.com, other@x.org ";
    const r = await verifyAdminLoginEmail(fd("HOST@example.com"));
    expect(r.ok).toBe(true);
  });

  it("rejects when not on allowlist", async () => {
    delete process.env.ADMIN_EMAILS;
    const r = await verifyAdminLoginEmail(fd("nope@gmail.com"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not authorized/i);
  });
});
