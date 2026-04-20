import { describe, expect, it, vi } from "vitest";
import { setSignupPaid } from "@/server/actions/admin-signups";

const createClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: vi.fn() })),
}));

const processWaitlistForGame = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("@/lib/waitlist", () => ({ processWaitlistForGame }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("setSignupPaid", () => {
  it("returns early when not admin", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    });
    const f = new FormData();
    f.append("id", "s1");
    f.append("paid", "true");
    await setSignupPaid(f);
    expect(createClient.mock.results[0]?.value).toBeDefined();
  });
});
