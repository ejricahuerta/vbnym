import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAdminExplicitEmailAllowlist,
  isAdminUser,
  isAllowedAdminEmail,
  isAuthorizedAdmin,
} from "@/lib/auth";

describe("isAdminUser", () => {
  it("returns false for null/undefined", () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
  });

  it("returns true for Google provider", () => {
    expect(
      isAdminUser({ app_metadata: { provider: "google" }, email: "x@y.com" })
    ).toBe(true);
  });

  it("returns true when providers array contains google", () => {
    expect(
      isAdminUser({ app_metadata: { providers: ["email", "google"] }, email: "x@y.com" })
    ).toBe(true);
  });

  it("returns false for non-Google provider", () => {
    expect(
      isAdminUser({ app_metadata: { provider: "email" }, email: "x@y.com" })
    ).toBe(false);
  });
});

describe("isAllowedAdminEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for @ednsy.com domain", () => {
    expect(isAllowedAdminEmail("Admin@EDNSY.COM")).toBe(true);
  });

  it("returns true for email in ADMIN_EMAILS env", () => {
    vi.stubEnv("ADMIN_EMAILS", "friend@example.com, other@test.org ");
    expect(isAllowedAdminEmail("Friend@example.com")).toBe(true);
  });

  it("returns false for unlisted email", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAllowedAdminEmail("someone@gmail.com")).toBe(false);
  });

  it("compares case-insensitively to ADMIN_EMAILS", () => {
    vi.stubEnv("ADMIN_EMAILS", "ORG@SITE.IO");
    expect(isAllowedAdminEmail("org@site.io")).toBe(true);
  });
});

describe("getAdminExplicitEmailAllowlist", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses comma-separated lowercased emails", () => {
    vi.stubEnv("ADMIN_EMAILS", " A@B.C , D@E.F ");
    expect(getAdminExplicitEmailAllowlist()).toEqual(["a@b.c", "d@e.f"]);
  });
});

describe("isAuthorizedAdmin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires both Google provider and allowed email", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    const googleEdnsy = { app_metadata: { provider: "google" }, email: "u@ednsy.com" };
    const googleOther = { app_metadata: { provider: "google" }, email: "u@gmail.com" };
    const emailOnly = { app_metadata: { provider: "email" }, email: "u@ednsy.com" };
    expect(isAuthorizedAdmin(googleEdnsy)).toBe(true);
    expect(isAuthorizedAdmin(googleOther)).toBe(false);
    expect(isAuthorizedAdmin(emailOnly)).toBe(false);
  });
});
