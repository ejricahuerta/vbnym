import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

describe("proxy", () => {
  it("redirects Supabase PKCE code from / to /auth/callback", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    vi.resetModules();
    const { proxy } = await import("@/proxy");
    const code = "bca7f969-3075-47cb-8c4d-d99d94fd56ee";
    const res = await proxy(
      new NextRequest(new URL(`http://localhost:3000/?code=${code}&state=x`))
    );
    expect(res.status).toBe(307);
    const loc = res.headers.get("location");
    expect(loc).toContain("/auth/callback");
    expect(loc).toContain(`code=${code}`);
    expect(loc).toContain("state=x");
  });

  it("passes through when Supabase env missing", async () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();
    const { proxy } = await import("@/proxy");
    const res = await proxy(new NextRequest(new URL("http://x/admin/games")));
    if (prevUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    if (prevKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    expect(res.status).not.toBe(307);
  });
});
