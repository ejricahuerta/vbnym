import { describe, expect, it } from "vitest";

import {
  decodeGmailOAuthState,
  encodeGmailOAuthState,
  isGameConnectionUsable,
  isUniversalInboxUsable,
  resolveEffectiveInbox,
} from "@/lib/gmail-sync";

describe("Gmail OAuth state", () => {
  it("round-trips encode/decode", () => {
    const raw = encodeGmailOAuthState({ v: 1, mode: "game", gameId: "abc-123" });
    expect(decodeGmailOAuthState(raw)).toEqual({
      v: 1,
      mode: "game",
      gameId: "abc-123",
    });
    expect(decodeGmailOAuthState(encodeGmailOAuthState({ v: 1, mode: "universal" }))).toEqual({
      v: 1,
      mode: "universal",
    });
  });

  it("rejects invalid state", () => {
    expect(decodeGmailOAuthState(null)).toBeNull();
    expect(decodeGmailOAuthState("not-json")).toBeNull();
  });
});

describe("resolveEffectiveInbox", () => {
  const future = new Date(Date.now() + 86400000 * 10).toISOString();

  it("prefers usable dedicated connection over universal", () => {
    const connId = "conn-1";
    const connById = new Map([
      [
        connId,
        {
          id: connId,
          gmail_refresh_token: "rt-game",
          gmail_connected_email: "g@example.com",
          gmail_assumed_expires_at: future,
          gmail_provider_refresh_expires_at: null,
          reauth_required: false,
          last_successful_refresh_at: null,
          gmail_connected_at: new Date().toISOString(),
        },
      ],
    ]);
    const universal = {
      gmail_refresh_token: "rt-org",
      gmail_connected_email: "org@example.com",
      gmail_assumed_expires_at: future,
      gmail_reauth_required: false,
    };
    const eff = resolveEffectiveInbox(
      "game-1",
      {
        game_id: "game-1",
        preferred_gmail_connection_id: connId,
        use_universal_fallback: true,
      },
      connById,
      universal
    );
    expect(eff).toEqual({
      refreshToken: "rt-game",
      kind: "game",
      connectionId: connId,
    });
  });

  it("falls back to universal when dedicated missing or unusable", () => {
    const connById = new Map<string, never>();
    const universal = {
      gmail_refresh_token: "rt-org",
      gmail_connected_email: "org@example.com",
      gmail_assumed_expires_at: future,
      gmail_reauth_required: false,
    };
    const eff = resolveEffectiveInbox(
      "game-1",
      {
        game_id: "game-1",
        preferred_gmail_connection_id: null,
        use_universal_fallback: true,
      },
      connById,
      universal
    );
    expect(eff).toEqual({ refreshToken: "rt-org", kind: "universal" });
  });

  it("returns null when fallback disabled and no dedicated inbox", () => {
    const eff = resolveEffectiveInbox(
      "game-1",
      {
        game_id: "game-1",
        preferred_gmail_connection_id: null,
        use_universal_fallback: false,
      },
      new Map(),
      {
        gmail_refresh_token: "rt-org",
        gmail_connected_email: "o@e.com",
        gmail_assumed_expires_at: future,
        gmail_reauth_required: false,
      }
    );
    expect(eff).toBeNull();
  });
});

describe("isGameConnectionUsable / isUniversalInboxUsable", () => {
  const past = new Date(Date.now() - 1000).toISOString();

  it("marks game connection unusable after assumed expiry", () => {
    expect(
      isGameConnectionUsable({
        id: "c",
        gmail_refresh_token: "x",
        gmail_connected_email: "a@b.com",
        gmail_assumed_expires_at: past,
        gmail_provider_refresh_expires_at: null,
        reauth_required: false,
        last_successful_refresh_at: null,
        gmail_connected_at: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it("marks universal unusable when reauth_required", () => {
    expect(
      isUniversalInboxUsable({
        gmail_refresh_token: "x",
        gmail_connected_email: "a@b.com",
        gmail_assumed_expires_at: null,
        gmail_reauth_required: true,
      })
    ).toBe(false);
  });
});
