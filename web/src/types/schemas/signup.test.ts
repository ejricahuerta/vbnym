import { describe, expect, it } from "vitest";

import { parseSignupFormData } from "@/types/schemas/signup";

function buildFormData(input: {
  gameId?: string;
  addedByName?: string;
  addedByEmail?: string;
  includeSigner?: "true" | "false";
  playersJson?: string;
}): FormData {
  const formData = new FormData();
  formData.set("gameId", input.gameId ?? "00000000-0000-4000-8000-000000000001");
  formData.set("addedByName", input.addedByName ?? "Ed Player");
  formData.set("addedByEmail", input.addedByEmail ?? "ed@example.com");
  formData.set("includeSigner", input.includeSigner ?? "true");
  formData.set("playersJson", input.playersJson ?? "[]");
  return formData;
}

describe("parseSignupFormData", () => {
  it("parses solo payload with empty players", () => {
    const result = parseSignupFormData(buildFormData({ includeSigner: "true", playersJson: "[]" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.players).toEqual([]);
  });

  it("parses include-signer payload with additional players", () => {
    const result = parseSignupFormData(buildFormData({ includeSigner: "true", playersJson: '["Sam K", "Jo N"]' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.includeSigner).toBe(true);
    expect(result.data.players).toEqual(["Sam K", "Jo N"]);
  });

  it("rejects include-signer payload above max group size", () => {
    const result = parseSignupFormData(
      buildFormData({ includeSigner: "true", playersJson: '["A A", "B B", "C C", "D D", "E E", "F F"]' })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("up to 6 players including yourself");
  });

  it("rejects invalid players JSON payload", () => {
    const result = parseSignupFormData(buildFormData({ playersJson: "not-json" }));
    expect(result.ok).toBe(false);
  });

  it("rejects friend-only signup with no players", () => {
    const result = parseSignupFormData(buildFormData({ includeSigner: "false", playersJson: "[]" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("at least one player");
  });
});
