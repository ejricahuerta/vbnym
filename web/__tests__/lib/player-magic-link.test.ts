import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("player-magic-link", () => {
  beforeEach(() => {
    vi.stubEnv("PLAYER_AUTH_SECRET", "test-secret-at-least-16-chars");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("creates and verifies a magic link token", async () => {
    const { createPlayerMagicLinkToken, verifyPlayerMagicLinkToken } = await import(
      "@/lib/player-magic-link"
    );
    const token = createPlayerMagicLinkToken("Player@Example.com");
    expect(token).toBeTruthy();
    const v = verifyPlayerMagicLinkToken(token!);
    expect(v?.email).toBe("player@example.com");
  });

  it("rejects tampered token", async () => {
    const { createPlayerMagicLinkToken, verifyPlayerMagicLinkToken } = await import(
      "@/lib/player-magic-link"
    );
    const token = createPlayerMagicLinkToken("a@b.com")!;
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(verifyPlayerMagicLinkToken(tampered)).toBeNull();
  });

  it("creates and verifies session token with future exp", async () => {
    const { createPlayerRecoverSessionToken, verifyPlayerRecoverSessionToken } = await import(
      "@/lib/player-magic-link"
    );
    const t = createPlayerRecoverSessionToken("a@b.com");
    expect(t).toBeTruthy();
    expect(verifyPlayerRecoverSessionToken(t)).toEqual({ email: "a@b.com" });
  });

  it("returns null when secret missing", async () => {
    vi.unstubAllEnvs();
    delete process.env.PLAYER_AUTH_SECRET;
    vi.resetModules();
    const { createPlayerMagicLinkToken } = await import("@/lib/player-magic-link");
    expect(createPlayerMagicLinkToken("a@b.com")).toBeNull();
  });
});
