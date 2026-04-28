import { describe, expect, it } from "vitest";

import { isPermitWindowActive } from "@/lib/league-permits";

describe("isPermitWindowActive", () => {
  const day = new Date("2026-06-15T12:00:00.000Z");

  it("returns true for active permit covering date", () => {
    expect(
      isPermitWindowActive(
        { status: "active", valid_from: "2026-01-01", valid_to: "2026-12-31" },
        day
      )
    ).toBe(true);
  });

  it("returns false when before valid_from", () => {
    expect(
      isPermitWindowActive(
        { status: "active", valid_from: "2026-07-01", valid_to: "2026-12-31" },
        day
      )
    ).toBe(false);
  });

  it("returns false when after valid_to", () => {
    expect(
      isPermitWindowActive(
        { status: "active", valid_from: "2026-01-01", valid_to: "2026-05-31" },
        day
      )
    ).toBe(false);
  });

  it("returns false when status is not active", () => {
    expect(
      isPermitWindowActive(
        { status: "draft", valid_from: "2026-01-01", valid_to: "2026-12-31" },
        day
      )
    ).toBe(false);
  });
});
