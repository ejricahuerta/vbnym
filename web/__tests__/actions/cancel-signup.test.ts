import { describe, expect, it, vi } from "vitest";
import { cancelSignup } from "@/actions/cancel-signup";
import { createQueuedSupabaseMock } from "@/__tests__/helpers/mocks";

const processWaitlistForGame = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/waitlist", () => ({ processWaitlistForGame }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const createAdminClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

vi.mock("@/lib/notifications", () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined),
}));

function fd(obj: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

describe("cancelSignup", () => {
  it("returns error when game_id or email missing", async () => {
    const r = await cancelSignup(fd({ game_id: "", email: "" }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/required/i);
  });

  it("returns error when game not found", async () => {
    const { client, push } = createQueuedSupabaseMock([]);
    push({ data: null, error: { message: "nope" } });
    createAdminClient.mockReturnValue(client);
    const r = await cancelSignup(fd({ game_id: "g", email: "a@b.com" }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});
