import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildRequest, expectRedirectTo } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  getHostSessionEmail: vi.fn(),
  createGoogleOAuthClient: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getHostSessionEmail: mocks.getHostSessionEmail,
}));

vi.mock("@/lib/gmail", () => ({
  createGoogleOAuthClient: mocks.createGoogleOAuthClient,
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

describe("api/gmail/host/oauth/start", () => {
  beforeEach(() => {
    mocks.getHostSessionEmail.mockReset();
    mocks.createGoogleOAuthClient.mockReset();
  });

  it("redirects to host login when host session is missing", async () => {
    mocks.getHostSessionEmail.mockResolvedValueOnce(null);
    const response = await GET();
    expectRedirectTo(response, "http://localhost:3000/host/login?gmail=unauthorized");
  });

  it("generates host auth redirect and cookies", async () => {
    mocks.getHostSessionEmail.mockResolvedValueOnce("host@example.com");
    mocks.createGoogleOAuthClient.mockReturnValueOnce({
      generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.test/host-auth"),
    });
    const uuidSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("host-state");

    const response = await GET();

    expectRedirectTo(response, "https://accounts.google.test/host-auth");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("gmail_oauth_state=host-state");
    expect(setCookie).toContain("gmail_oauth_flow=host");
    uuidSpy.mockRestore();
  });
});
