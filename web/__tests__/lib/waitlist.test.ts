import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, Signup } from "@/types/vbnym";

const sendTransactionalEmail = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/notifications", () => ({
  sendTransactionalEmail: (...a: unknown[]) => sendTransactionalEmail(...a),
}));

function baseGame(over: Partial<Game> = {}): Game {
  return {
    id: "game-1",
    location: "Gym",
    address: null,
    lat: null,
    lng: null,
    date: "2030-03-01",
    time: "18:00",
    cap: 4,
    price: 10,
    etransfer: "pay@test.com",
    listed: true,
    ...over,
  };
}

describe("enqueueWaitlistAndNotify", () => {
  beforeEach(() => {
    sendTransactionalEmail.mockClear();
    process.env.PAYMENT_CODE_SECRET = "secret-for-waitlist-tests";
  });

  afterEach(() => {
    delete process.env.PAYMENT_CODE_SECRET;
  });

  it("returns try-again when a spot is available (booked < cap)", async () => {
    const { enqueueWaitlistAndNotify } = await import("@/lib/waitlist");
    const game = baseGame({ cap: 10 });
    const live: Signup[] = [
      {
        id: "1",
        game_id: game.id,
        name: "A",
        email: "a@a.com",
        paid: true,
        friends: [],
        payment_code: null,
      },
    ];
    const admin = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: live, error: null }),
        }),
      })),
    };
    const res = await enqueueWaitlistAndNotify(admin as never, {
      game,
      name: "W",
      email: "w@w.com",
      friends: [],
      phone: null,
      waiverAccepted: true,
    });
    expect(res.waitlisted).toBe(false);
    expect(res.message).toContain("try submitting again");
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("inserts waitlist row and emails when full (holding unpaid)", async () => {
    const { enqueueWaitlistAndNotify } = await import("@/lib/waitlist");
    const game = baseGame({ cap: 2 });
    const live: Signup[] = [
      {
        id: "1",
        game_id: game.id,
        name: "A",
        email: "a@a.com",
        paid: false,
        friends: ["F1"],
        payment_code: "X",
        payment_code_expires_at: new Date(Date.now() + 600000).toISOString(),
      },
    ];
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "signups") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: live, error: null }),
            }),
          };
        }
        if (table === "waitlist_signups") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert,
          };
        }
        throw new Error(table);
      }),
    };
    const res = await enqueueWaitlistAndNotify(admin as never, {
      game,
      name: "Wait",
      email: "wait@test.com",
      friends: [],
      phone: null,
      waiverAccepted: true,
    });
    expect(res.waitlisted).toBe(true);
    expect(insert).toHaveBeenCalled();
    expect(sendTransactionalEmail).toHaveBeenCalled();
  });

  it("skips insert when already pending/invited for same email", async () => {
    const { enqueueWaitlistAndNotify } = await import("@/lib/waitlist");
    const game = baseGame({ cap: 1 });
    const live: Signup[] = [
      {
        id: "1",
        game_id: game.id,
        name: "A",
        email: "a@a.com",
        paid: true,
        friends: [],
        payment_code: null,
      },
    ];
    const insert = vi.fn();
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "signups") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: live, error: null }),
            }),
          };
        }
        if (table === "waitlist_signups") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({
                          data: { id: "wl-1", status: "pending" },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert,
          };
        }
        throw new Error(table);
      }),
    };
    const res = await enqueueWaitlistAndNotify(admin as never, {
      game,
      name: "Wait",
      email: "wait@test.com",
      friends: [],
      phone: null,
      waiverAccepted: true,
    });
    expect(res.waitlisted).toBe(true);
    expect(res.message).toContain("already on the waitlist");
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("processWaitlistForGame", () => {
  beforeEach(() => {
    sendTransactionalEmail.mockClear();
  });

  it("returns early when PAYMENT_CODE_SECRET missing after loading pending", async () => {
    delete process.env.PAYMENT_CODE_SECRET;
    const { processWaitlistForGame } = await import("@/lib/waitlist");
    const game = baseGame({ cap: 10 });
    let signupsFrom = 0;
    let waitlistFrom = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "signups") {
          signupsFrom += 1;
          if (signupsFrom === 1) {
            return {
              delete: () => ({
                eq: () => ({
                  eq: () => ({
                    lt: () => Promise.resolve({ error: null }),
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        }
        if (table === "waitlist_signups") {
          waitlistFrom += 1;
          if (waitlistFrom === 1) {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    lt: () => Promise.resolve({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        throw new Error(table);
      }),
    };
    await processWaitlistForGame(admin as never, game);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("deletes stale invite signup and marks waitlist expired", async () => {
    process.env.PAYMENT_CODE_SECRET = "s";
    const { processWaitlistForGame } = await import("@/lib/waitlist");
    const game = baseGame({ cap: 10 });
    const staleInvite = {
      id: "wl-1",
      game_id: game.id,
      signup_id: "su-old",
      status: "invited",
      invitation_expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    let signupsFrom = 0;
    let waitlistFrom = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "signups") {
          signupsFrom += 1;
          if (signupsFrom === 1) {
            return {
              delete: () => ({
                eq: () => ({
                  eq: () => ({
                    lt: () => Promise.resolve({ error: null }),
                  }),
                }),
              }),
            };
          }
          if (signupsFrom === 2) {
            return {
              delete: () => ({
                eq: () => ({
                  eq: () => Promise.resolve({ error: null }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        }
        if (table === "waitlist_signups") {
          waitlistFrom += 1;
          if (waitlistFrom === 1) {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    lt: () => Promise.resolve({ data: [staleInvite], error: null }),
                  }),
                }),
              }),
            };
          }
          if (waitlistFrom === 2) {
            return {
              update: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        throw new Error(table);
      }),
    };
    await processWaitlistForGame(admin as never, game);
    delete process.env.PAYMENT_CODE_SECRET;
    expect(signupsFrom).toBeGreaterThanOrEqual(2);
    expect(waitlistFrom).toBe(3);
  });
});
