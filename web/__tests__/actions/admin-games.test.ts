import { describe, expect, it, vi } from "vitest";
import { createGame, deleteGame, updateGame } from "@/actions/admin-games";

const createClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

function gameForm(over: Record<string, string> = {}) {
  const f = new FormData();
  const base: Record<string, string> = {
    location: "Gym",
    date: "2030-02-01",
    time: "18:00",
    cap: "12",
    price: "10",
    etransfer: "pay@test.com",
    visibility: "public",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.append(k, v);
  return f;
}

describe("admin games", () => {
  it("createGame rejects when not admin", async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) };
    createClient.mockResolvedValue({ auth, from: vi.fn() });
    const r = await createGame(gameForm());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Admin login required/i);
  });

  it("deleteGame no-ops when not admin", async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) };
    const del = vi.fn();
    createClient.mockResolvedValue({ auth, from: () => ({ delete: () => ({ eq: del }) }) });
    const f = new FormData();
    f.append("id", "game-1");
    await deleteGame(f);
    expect(del).not.toHaveBeenCalled();
  });
});
