import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, expectRedirectTo } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  getHostSessionEmail: vi.fn(),
  createGoogleOAuthClient: vi.fn(),
  createServerSupabase: vi.fn(),
  sendTransactionalEmailResult: vi.fn(),
  buildGmailConnectedEmailTemplate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getHostSessionEmail: mocks.getHostSessionEmail,
}));

vi.mock("@/lib/gmail", () => ({
  createGoogleOAuthClient: mocks.createGoogleOAuthClient,
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: mocks.createServerSupabase,
}));

vi.mock("@/lib/send-email", () => ({
  sendTransactionalEmailResult: mocks.sendTransactionalEmailResult,
}));

vi.mock("@/lib/email-templates", () => ({
  buildGmailConnectedEmailTemplate: mocks.buildGmailConnectedEmailTemplate,
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
    mocks.createGoogleOAuthClient.mockReset();
    mocks.createServerSupabase.mockReset();
    mocks.sendTransactionalEmailResult.mockReset();
    mocks.buildGmailConnectedEmailTemplate.mockReset();
    mocks.buildGmailConnectedEmailTemplate.mockReturnValue({
      subject: "Gmail connected for payment sync",
      html: "<p>Gmail connected</p>",
      text: "Gmail connected",
    });
    mocks.sendTransactionalEmailResult.mockResolvedValue({ ok: true });
  });

  it("redirects invalid state to host", async () => {
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=raw-state",
        headers: { cookie: "gmail_oauth_state=other-cookie" },
      })
    );
    expectRedirectTo(response, "http://localhost:3000/host?gmail=invalid-state");
  });

  it("redirects to host login when session missing", async () => {
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      getToken: vi.fn().mockResolvedValue({ tokens: { refresh_token: "refresh-token" } }),
    });
    mocks.getHostSessionEmail.mockResolvedValueOnce(null);
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=host-state",
        headers: { cookie: "gmail_oauth_state=host-state" },
      })
    );
    expectRedirectTo(response, "http://localhost:3000/host/login?gmail=session-expired");
  });

  it("redirects when refresh token is missing", async () => {
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      getToken: vi.fn().mockResolvedValue({ tokens: { access_token: "acc" } }),
    });
    const response = await GET(
      buildRequest({
        url: "http://localhost/api/gmail/oauth/callback?code=abc&state=host-state",
        headers: { cookie: "gmail_oauth_state=host-state" },
      })
    );
    expectRedirectTo(response, "http://localhost:3000/host?gmail=missing-refresh-token");
  });

  it("upserts host gmail connection, sends confirmation, and redirects", async () => {
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
        headers: { cookie: "gmail_oauth_state=host-state" },
      })
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "host:host@example.com",
        access_token: "acc",
        refresh_token: "refresh",
        active: true,
      }),
      { onConflict: "id" }
    );
    expect(mocks.buildGmailConnectedEmailTemplate).toHaveBeenCalledWith({
      dashboardUrl: "http://localhost:3000/host",
    });
    expect(mocks.sendTransactionalEmailResult).toHaveBeenCalledWith({
      to: "host@example.com",
      subject: "Gmail connected for payment sync",
      html: "<p>Gmail connected</p>",
      text: "Gmail connected",
    });
    expectRedirectTo(response, "http://localhost:3000/host?gmail=connected");
  });
});
