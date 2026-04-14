import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

describe("middleware", () => {
  it("passes through when Supabase env missing", async () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();
    const { middleware } = await import("@/middleware");
    const res = await middleware(new NextRequest(new URL("http://x/admin/games")));
    if (prevUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    if (prevKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    expect(res.status).not.toBe(307);
  });
});
