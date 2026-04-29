import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectRedirectTo } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  getHostSessionEmail: vi.fn(),
  createServerSupabase: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getHostSessionEmail: mocks.getHostSessionEmail,
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

import { POST } from "./route";

describe("api/gmail/host/oauth/disconnect", () => {
  beforeEach(() => {
    mocks.getHostSessionEmail.mockReset();
    mocks.createServerSupabase.mockReset();
  });

  it("redirects to host login if unauthenticated", async () => {
    mocks.getHostSessionEmail.mockResolvedValueOnce(null);
    const response = await POST();
    expectRedirectTo(response, "http://localhost:3000/host/login?gmail=unauthorized");
  });

  it("deletes host connection and redirects", async () => {
    mocks.getHostSessionEmail.mockResolvedValueOnce("host@example.com");
    const eqMock = vi.fn().mockResolvedValue(undefined);
    const deleteMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ delete: deleteMock }));
    mocks.createServerSupabase.mockReturnValueOnce({ from: fromMock });

    const response = await POST();

    expect(fromMock).toHaveBeenCalledWith("gmail_connections");
    expect(eqMock).toHaveBeenCalledWith("id", "host:host@example.com");
    expectRedirectTo(response, "http://localhost:3000/host?gmail=disconnected");
  });
});
