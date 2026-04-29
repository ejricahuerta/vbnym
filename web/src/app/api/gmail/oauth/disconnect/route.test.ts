import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectRedirectTo } from "@/test/route-test-helpers";

const mocks = vi.hoisted(() => ({
  isAdminAuthorized: vi.fn(),
  createServerSupabase: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  isAdminAuthorized: mocks.isAdminAuthorized,
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

describe("api/gmail/oauth/disconnect", () => {
  beforeEach(() => {
    mocks.isAdminAuthorized.mockReset();
    mocks.createServerSupabase.mockReset();
  });

  it("redirects unauthorized users", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(false);
    const response = await POST();
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=unauthorized");
  });

  it("deletes universal connection then redirects", async () => {
    mocks.isAdminAuthorized.mockResolvedValueOnce(true);
    const eqMock = vi.fn().mockResolvedValue(undefined);
    const deleteMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ delete: deleteMock }));
    mocks.createServerSupabase.mockReturnValueOnce({ from: fromMock });

    const response = await POST();

    expect(fromMock).toHaveBeenCalledWith("gmail_connections");
    expect(eqMock).toHaveBeenCalledWith("id", "universal");
    expectRedirectTo(response, "http://localhost:3000/admin?gmail=disconnected");
  });
});
