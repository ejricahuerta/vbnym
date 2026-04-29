import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, expectRedirectTo } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  getHostSessionEmail: vi.fn(),
  decodeGmailOAuthState: vi.fn(),
  createGoogleOAuthClient: vi.fn(),
  createServerSupabase: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getHostSessionEmail: mocks.getHostSessionEmail,
}));

vi.mock("@/lib/gmail", () => ({
  decodeGmailOAuthState: mocks.decodeGmailOAuthState,
  createGoogleOAuthClient: mocks.createGoogleOAuthClient,
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: mocks.createServerSupabase,
}));

vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return {
    ...actual,
    appOrigin: () => "http://localhost:3000",
  };
});

import { GET } from "./route";

describe("api/gmail/oauth/callback", () => {
  beforeEach(() => {
    mocks.getHostSessionEmail.mockReset();
    mocks.decodeGmailOAuthState.mockReset();
    mocks.createGoogleOAuthClient.mockReset();
    mocks.createServerSupabase.mockReset();
  });

  it("redirects invalid state to admin", async () => {
    mocks.decodeGmailOAuthState.mockReturnValueOnce(null);
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=raw-state",
        headers: { cookie: "gmail_oauth_state=csrf-cookie; gmail_oauth_flow=admin" },
      })
    );
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=invalid-state");
  });

  it("redirects host flow to login when session missing", async () => {
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      getToken: vi.fn().mockResolvedValue({ tokens: { refresh_token: "refresh-token" } }),
    });
    mocks.getHostSessionEmail.mockResolvedValueOnce(null);
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=host-state",
        headers: { cookie: "gmail_oauth_state=host-state; gmail_oauth_flow=host" },
      })
    );
    expectRedirectTo(response, "http://localhost:3000/host/login?gmail=session-expired");
  });

  it("upserts host gmail connection and redirects connected", async () => {
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      getToken: vi.fn().mockResolvedValue({
        tokens: { access_token: "acc", refresh_token: "refresh", expiry_date: 1_700_000_000_000 },
      }),
    });
    mocks.getHostSessionEmail.mockResolvedValueOnce("host@example.com");
    const upsertMock = vi.fn().mockResolvedValue({});
    mocks.createServerSupabase.mockReturnValueOnce({
      from: vi.fn(() => ({ upsert: upsertMock })),
    });

    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=host-state",
        headers: { cookie: "gmail_oauth_state=host-state; gmail_oauth_flow=host" },
      })
    );

    expect(upsertMock).toHaveBeenCalled();
    expectRedirectTo(response, "http://localhost:3000/host?gmail=connected");
  });

  it("upserts universal connection for admin flow", async () => {
    mocks.decodeGmailOAuthState.mockReturnValueOnce({ v: 1, csrf: "csrf-cookie", mode: "universal" });
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      getToken: vi.fn().mockResolvedValue({
        tokens: { access_token: "acc", refresh_token: "refresh", expiry_date: 1_700_000_000_000 },
      }),
    });
    const upsertMock = vi.fn().mockResolvedValue({});
    mocks.createServerSupabase.mockReturnValueOnce({
      from: vi.fn((table: string) => {
        if (table === "gmail_connections") return { upsert: upsertMock };
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=encoded",
        headers: { cookie: "gmail_oauth_state=csrf-cookie; gmail_oauth_flow=admin" },
      })
    );

    expect(upsertMock).toHaveBeenCalled();
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=connected");
  });

  it("handles game mode config with existing preferred connection", async () => {
    mocks.decodeGmailOAuthState.mockReturnValueOnce({ v: 1, csrf: "csrf-cookie", mode: "game", gameId: "game-1" });
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      getToken: vi.fn().mockResolvedValue({ tokens: { refresh_token: "refresh" } }),
    });

    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { preferred_gmail_connection_id: "conn-1", use_universal_fallback: true },
    });
    const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
    const selectCfgMock = vi.fn(() => ({ eq: eqMock }));
    const updateEqMock = vi.fn().mockResolvedValue({});
    const updateMock = vi.fn(() => ({ eq: updateEqMock }));
    const upsertCfgMock = vi.fn().mockResolvedValue({});
    const fromMock = vi.fn((table: string) => {
      if (table === "game_email_sync_config") return { select: selectCfgMock, upsert: upsertCfgMock };
      if (table === "gmail_connections") return { update: updateMock };
      throw new Error(`unexpected table ${table}`);
    });
    mocks.createServerSupabase.mockReturnValueOnce({ from: fromMock });

    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=encoded",
        headers: { cookie: "gmail_oauth_state=csrf-cookie; gmail_oauth_flow=admin" },
      })
    );

    expect(updateMock).toHaveBeenCalled();
    expect(upsertCfgMock).toHaveBeenCalled();
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=connected");
  });
});
