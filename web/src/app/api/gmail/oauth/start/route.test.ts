import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, expectRedirectTo } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  isAdminAuthorized: vi.fn(),
  createGoogleOAuthClient: vi.fn(),
  encodeGmailOAuthState: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  isAdminAuthorized: mocks.isAdminAuthorized,
}));

vi.mock("@/lib/gmail", () => ({
  createGoogleOAuthClient: mocks.createGoogleOAuthClient,
  encodeGmailOAuthState: mocks.encodeGmailOAuthState,
}));

vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return {
    ...actual,
    appOrigin: () => "http://localhost:3000",
    cookieSecure: () => false,
  };
});

import { GET } from "./route";

describe("api/gmail/oauth/start", () => {
  beforeEach(() => {
    mocks.isAdminAuthorized.mockReset();
    mocks.createGoogleOAuthClient.mockReset();
    mocks.encodeGmailOAuthState.mockReset();
  });

  it("redirects unauthorized users to admin page", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(false);
    const response = await GET(buildRequest({ url: "http://localhost/api/gmail/oauth/start" }));
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=unauthorized");
  });

  it("redirects with missing gameId when mode=game", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(true);
    const response = await GET(buildRequest({ url: "http://localhost/api/gmail/oauth/start?mode=game" }));
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=missing-game-id");
  });

  it("builds auth url and sets oauth cookies", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(true);
    mocks.encodeGmailOAuthState.mockReturnValueOnce("encoded-state");
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.test/auth"),
    });
    const uuidSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("csrf-id");

    const response = await GET(
      buildRequest({ url: "http://localhost/api/gmail/oauth/start?mode=game&gameId=game-123" })
    );

    expectRedirectTo(response, "https://accounts.google.test/auth");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("gmail_oauth_state=csrf-id");
    expect(setCookie).toContain("gmail_oauth_flow=admin");
    expect(mocks.encodeGmailOAuthState).toHaveBeenCalledWith({
      v: 1,
      csrf: "csrf-id",
      mode: "game",
      gameId: "game-123",
    });
    uuidSpy.mockRestore();
  });
});
