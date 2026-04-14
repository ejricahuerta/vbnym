import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signupForRun } from "@/actions/signup";
import { createQueuedSupabaseMock } from "@/__tests__/helpers/mocks";

const processWaitlistForGame = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const enqueueWaitlistAndNotify = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ waitlisted: true, message: "waitlisted" })
);

vi.mock("@/lib/waitlist", () => ({
  processWaitlistForGame,
  enqueueWaitlistAndNotify,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const createAdminClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/notifications", () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined),
}));

function form(obj: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) for (const x of v) fd.append(k, x);
    else fd.append(k, v);
  }
  return fd;
}

describe("signupForRun", () => {
  const prevSecret = process.env.PAYMENT_CODE_SECRET;

  beforeEach(() => {
    process.env.PAYMENT_CODE_SECRET = "secret";
    vi.mocked(processWaitlistForGame).mockClear();
    vi.mocked(enqueueWaitlistAndNotify).mockClear();
    createAdminClient.mockReset();
  });

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.PAYMENT_CODE_SECRET;
    else process.env.PAYMENT_CODE_SECRET = prevSecret;
  });

  it("returns error when name/email missing", async () => {
    const r = await signupForRun(form({ game_id: "g", waiver_accepted: "on" }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/required/i);
  });

  it("returns error when waiver not accepted", async () => {
    const r = await signupForRun(
      form({ game_id: "g", name: "A", email: "a@b.com", waiver_accepted: "" })
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/waiver/i);
  });

  it("returns error when PAYMENT_CODE_SECRET missing", async () => {
    delete process.env.PAYMENT_CODE_SECRET;
    const r = await signupForRun(
      form({ game_id: "g", name: "A", email: "a@b.com", waiver_accepted: "on" })
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/PAYMENT_CODE_SECRET/i);
  });

  it("returns error when game not found", async () => {
    const { client, push } = createQueuedSupabaseMock([]);
    push({ data: null, error: { message: "not found" } });
    createAdminClient.mockReturnValue(client);
    const r = await signupForRun(
      form({
        game_id: "missing",
        name: "A",
        email: "a@b.com",
        waiver_accepted: "on",
      })
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it("calls processWaitlistForGame before RPC", async () => {
    const game = {
      id: "g1",
      location: "Gym",
      address: null,
      lat: null,
      lng: null,
      date: "2030-01-01",
      time: "18:00",
      cap: 10,
      price: 10,
      etransfer: "pay@test.com",
      listed: true,
      registration_opens_at: null,
    };
    const { client, push, setRpcResult } = createQueuedSupabaseMock([]);
    push({ data: game, error: null });
    push({ data: null, error: null });
    setRpcResult({ data: { ok: true }, error: null });
    createAdminClient.mockReturnValue(client);
    await signupForRun(
      form({
        game_id: "g1",
        name: "A",
        email: "a@b.com",
        waiver_accepted: "on",
      })
    );
    expect(processWaitlistForGame).toHaveBeenCalled();
  });

  it("returns waitlisted path when RPC says full", async () => {
    const game = {
      id: "g1",
      location: "Gym",
      address: null,
      lat: null,
      lng: null,
      date: "2030-01-01",
      time: "18:00",
      cap: 2,
      price: 10,
      etransfer: "pay@test.com",
      listed: true,
      registration_opens_at: null,
    };
    const { client, push, setRpcResult } = createQueuedSupabaseMock([]);
    push({ data: game, error: null });
    push({ data: null, error: null });
    setRpcResult({ data: { ok: false, reason: "full" }, error: null });
    createAdminClient.mockReturnValue(client);
    const r = await signupForRun(
      form({
        game_id: "g1",
        name: "A",
        email: "a@b.com",
        waiver_accepted: "on",
      })
    );
    expect(r.ok).toBe(false);
    expect(enqueueWaitlistAndNotify).toHaveBeenCalled();
  });
});
