import { describe, expect, it, vi } from "vitest";
import { submitCommunityFeedback } from "@/actions/community-feedback";

const createAdminClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

describe("submitCommunityFeedback", () => {
  it("rejects invalid category", async () => {
    const f = new FormData();
    f.append("category", "nope");
    f.append("name", "Ab");
    f.append("email", "a@b.com");
    f.append("message", "1234567890");
    const r = await submitCommunityFeedback(null, f);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/topic/i);
  });

  it("rejects name shorter than 2 chars after trim", async () => {
    const f = new FormData();
    f.append("category", "bug");
    f.append("name", "A");
    f.append("email", "a@b.com");
    f.append("message", "1234567890");
    const r = await submitCommunityFeedback(null, f);
    expect(r.ok).toBe(false);
  });

  it("rejects invalid email", async () => {
    const f = new FormData();
    f.append("category", "bug");
    f.append("name", "Ab");
    f.append("email", "not-email");
    f.append("message", "1234567890");
    const r = await submitCommunityFeedback(null, f);
    expect(r.ok).toBe(false);
  });

  it("rejects short message", async () => {
    const f = new FormData();
    f.append("category", "bug");
    f.append("name", "Ab");
    f.append("email", "a@b.com");
    f.append("message", "short");
    const r = await submitCommunityFeedback(null, f);
    expect(r.ok).toBe(false);
  });

  it("inserts on success", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    createAdminClient.mockReturnValue({ from: () => ({ insert }) });
    const f = new FormData();
    f.append("category", "bug");
    f.append("name", "Alex");
    f.append("email", "alex@example.com");
    f.append("message", "1234567890 detail here");
    const r = await submitCommunityFeedback(null, f);
    expect(r.ok).toBe(true);
    expect(insert).toHaveBeenCalled();
  });
});
