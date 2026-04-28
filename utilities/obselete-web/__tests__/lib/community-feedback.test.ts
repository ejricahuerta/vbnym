import { describe, expect, it } from "vitest";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_CATEGORY_VALUES,
} from "@/lib/community-feedback";

describe("community feedback categories", () => {
  it("COMMUNITY_CATEGORY_VALUES contains expected values", () => {
    expect(COMMUNITY_CATEGORY_VALUES.has("bug")).toBe(true);
    expect(COMMUNITY_CATEGORY_VALUES.has("feature")).toBe(true);
    expect(COMMUNITY_CATEGORY_VALUES.has("sponsor")).toBe(true);
    expect(COMMUNITY_CATEGORY_VALUES.has("host_game")).toBe(true);
    expect(COMMUNITY_CATEGORY_VALUES.has("ads")).toBe(true);
  });

  it("Set matches COMMUNITY_CATEGORIES array", () => {
    const fromArray = [...COMMUNITY_CATEGORIES.map((c) => c.value)].sort();
    const fromSet = [...COMMUNITY_CATEGORY_VALUES].sort();
    expect(fromSet).toEqual(fromArray);
  });
});
