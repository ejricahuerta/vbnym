import { describe, expect, it, vi } from "vitest";
import { lookupGamesByEmail } from "@/server/actions/lookup-games";

const createClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

function fd(email: string) {
  const f = new FormData();
  f.append("email", email);
  return f;
}

describe("lookupGamesByEmail", () => {
  it("returns error for invalid email", async () => {
    const r = await lookupGamesByEmail(fd("not-an-email"));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/valid email/i);
  });

  it("returns error when Supabase not configured", async () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const r = await lookupGamesByEmail(fd("a@b.com"));
    if (prevUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (prevKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not configured/i);
  });
});
