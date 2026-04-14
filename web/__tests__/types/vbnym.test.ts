import { describe, expect, it } from "vitest";
import {
  bookedHeadsForGame,
  headsForSignup,
  isGameListed,
  type Signup,
} from "@/types/vbnym";

const baseSignup = (over: Partial<Signup>): Signup => ({
  id: "1",
  game_id: "g",
  name: "N",
  email: "e@e.com",
  paid: false,
  friends: [],
  payment_code: null,
  ...over,
});

describe("headsForSignup", () => {
  it("returns 1 for no friends", () => {
    expect(headsForSignup(baseSignup({ friends: [] }))).toBe(1);
  });

  it("returns 1 + friends.length", () => {
    expect(headsForSignup(baseSignup({ friends: ["a", "b"] }))).toBe(3);
  });

  it("treats null friends as none", () => {
    expect(headsForSignup(baseSignup({ friends: null }))).toBe(1);
  });
});

describe("bookedHeadsForGame", () => {
  it("sums heads across signups", () => {
    const signups = [
      baseSignup({ id: "1", friends: ["a"] }),
      baseSignup({ id: "2", friends: [] }),
    ];
    expect(bookedHeadsForGame(signups)).toBe(3);
  });

  it("returns 0 for empty array", () => {
    expect(bookedHeadsForGame([])).toBe(0);
  });
});

describe("isGameListed", () => {
  it("returns true when listed is true, null, or undefined", () => {
    expect(isGameListed({ listed: true })).toBe(true);
    expect(isGameListed({ listed: null })).toBe(true);
    expect(isGameListed({ listed: undefined })).toBe(true);
  });

  it("returns false when listed is false", () => {
    expect(isGameListed({ listed: false })).toBe(false);
  });
});
