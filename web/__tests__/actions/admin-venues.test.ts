import { describe, expect, it, vi } from "vitest";
import { createVenue } from "@/actions/admin-venues";

const createClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));

function venueForm(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = { name: "Arena", ...over };
  for (const [k, v] of Object.entries(base)) f.append(k, v);
  return f;
}

describe("admin venues", () => {
  it("createVenue requires admin", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const r = await createVenue(venueForm());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Admin login required/i);
  });

  it("createVenue requires name", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { email: "o@ednsy.com", app_metadata: { provider: "google" } },
          },
        }),
      },
    });
    const f = new FormData();
    f.append("name", "");
    const r = await createVenue(f);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/name/i);
  });
});
