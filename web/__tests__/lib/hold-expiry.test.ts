import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, Signup } from "@/types/vbnym";

const sendTransactionalEmail = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/notifications", () => ({
  sendTransactionalEmail: (...a: unknown[]) => sendTransactionalEmail(...a),
}));

function signupsSelectChain(result: { data: Signup[]; error: null }) {
  return {
    select: () => ({
      eq: () => ({
        not: () => ({
          lt: () => Promise.resolve(result),
        }),
      }),
    }),
  };
}

function signupsDeleteChain() {
  return {
    delete: () => ({
      eq: () => ({
        not: () => ({
          lt: () => Promise.resolve({ error: null }),
        }),
      }),
    }),
  };
}

describe("notifyAndCleanExpiredHolds", () => {
  beforeEach(() => {
    sendTransactionalEmail.mockClear();
    sendTransactionalEmail.mockResolvedValue(undefined);
  });

  it("returns 0 when no expired signups", async () => {
    const admin = { from: vi.fn(() => signupsSelectChain({ data: [], error: null })) };
    const { notifyAndCleanExpiredHolds } = await import("@/lib/hold-expiry");
    expect(await notifyAndCleanExpiredHolds(admin as never)).toBe(0);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledTimes(1);
  });

  it("sends hold-expired email, increments count, then bulk-deletes", async () => {
    const game: Game = {
      id: "g1",
      location: "Court",
      address: null,
      lat: null,
      lng: null,
      date: "2030-02-01",
      time: "18:00",
      cap: 12,
      price: 15,
      etransfer: "pay@test.com",
      listed: true,
    };
    const expired: Signup[] = [
      {
        id: "s1",
        game_id: game.id,
        name: "Alex",
        email: "alex@test.com",
        paid: false,
        friends: [],
        payment_code: "NYM-XXYY-ZZ99",
        payment_code_expires_at: new Date(Date.now() - 60000).toISOString(),
      },
    ];

    let signupsCalls = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "signups") {
          signupsCalls += 1;
          if (signupsCalls === 1) return signupsSelectChain({ data: expired, error: null });
          return signupsDeleteChain();
        }
        if (table === "games") {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [game], error: null }),
            }),
          };
        }
        throw new Error(table);
      }),
    };

    const { notifyAndCleanExpiredHolds } = await import("@/lib/hold-expiry");
    const n = await notifyAndCleanExpiredHolds(admin as never);
    expect(n).toBe(1);
    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "alex@test.com" })
    );
    expect(admin.from).toHaveBeenCalledWith("signups");
    expect(signupsCalls).toBe(2);
  });

  it("does not increment notified when email throws, still deletes", async () => {
    sendTransactionalEmail.mockRejectedValueOnce(new Error("resend down"));
    const game: Game = {
      id: "g1",
      location: "Court",
      address: null,
      lat: null,
      lng: null,
      date: "2030-02-01",
      time: "18:00",
      cap: 12,
      price: 15,
      etransfer: "pay@test.com",
      listed: true,
    };
    const expired: Signup[] = [
      {
        id: "s1",
        game_id: game.id,
        name: "Alex",
        email: "alex@test.com",
        paid: false,
        friends: [],
        payment_code: "NYM-AA-BB",
        payment_code_expires_at: new Date(Date.now() - 60000).toISOString(),
      },
    ];
    let signupsCalls = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "signups") {
          signupsCalls += 1;
          if (signupsCalls === 1) return signupsSelectChain({ data: expired, error: null });
          return signupsDeleteChain();
        }
        if (table === "games") {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [game], error: null }),
            }),
          };
        }
        throw new Error(table);
      }),
    };
    const { notifyAndCleanExpiredHolds } = await import("@/lib/hold-expiry");
    const n = await notifyAndCleanExpiredHolds(admin as never);
    expect(n).toBe(0);
    expect(signupsCalls).toBe(2);
  });
});
