import { describe, expect, it } from "vitest";

import { createLeaguePaymentReferenceCode } from "@/lib/league-payment-code";

describe("createLeaguePaymentReferenceCode", () => {
  it("returns L- prefix and unique values", () => {
    const a = createLeaguePaymentReferenceCode();
    const b = createLeaguePaymentReferenceCode();
    expect(a).toMatch(/^L-[A-F0-9]{4}-[A-F0-9]{6}$/);
    expect(b).toMatch(/^L-[A-F0-9]{4}-[A-F0-9]{6}$/);
    expect(a).not.toBe(b);
  });
});
