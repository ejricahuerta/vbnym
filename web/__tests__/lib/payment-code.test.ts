import { describe, expect, it } from "vitest";
import { generatePaymentCode } from "@/lib/payment-code";

describe("generatePaymentCode", () => {
  const secret = "test-secret";

  it("generates NYM-XXXX-XXXX format", () => {
    const code = generatePaymentCode("g1", "s1", "a@b.com", secret);
    expect(code).toMatch(/^NYM-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("is deterministic for same inputs", () => {
    expect(generatePaymentCode("g1", "s1", "a@b.com", secret)).toBe(
      generatePaymentCode("g1", "s1", "a@b.com", secret)
    );
  });

  it("differs when inputs change", () => {
    const a = generatePaymentCode("g1", "s1", "a@b.com", secret);
    const b = generatePaymentCode("g2", "s1", "a@b.com", secret);
    const c = generatePaymentCode("g1", "s2", "a@b.com", secret);
    const d = generatePaymentCode("g1", "s1", "b@b.com", secret);
    expect(new Set([a, b, c, d]).size).toBe(4);
  });

  it("normalizes email case-insensitively", () => {
    expect(generatePaymentCode("g1", "s1", "User@EXAMPLE.com", secret)).toBe(
      generatePaymentCode("g1", "s1", "user@example.com", secret)
    );
  });
});
