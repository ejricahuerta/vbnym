import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, Signup } from "@/types/vbnym";

const listMock = vi.fn();
const getMock = vi.fn();

vi.mock("googleapis", () => {
  class OAuth2Mock {
    setCredentials = vi.fn();
    generateAuthUrl = vi.fn(() => "https://oauth");
    getToken = vi.fn();
  }
  return {
  google: {
    auth: {
      OAuth2: OAuth2Mock,
    },
    gmail: vi.fn(() => ({
      users: {
        messages: {
          list: (...a: unknown[]) => listMock(...a),
          get: (...a: unknown[]) => getMock(...a),
        },
      },
    })),
    oauth2: vi.fn(),
  },
};
});

vi.mock("@/lib/notifications", () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined),
}));

function thenable<T>(data: T, error: { message: string } | null = null) {
  const result = { data, error };
  const self = {
    select: () => self,
    insert: () => self,
    update: () => self,
    eq: () => self,
    not: () => self,
    is: () => self,
    single: async () => result,
    maybeSingle: async () => result,
    then: (onFulfilled?: (r: typeof result) => unknown) =>
      Promise.resolve(result).then(onFulfilled ?? ((x) => x)),
  };
  return self;
}

describe("extractCodes & parseSenderEmail", () => {
  it("extractCodes finds NYM codes and dedupes", async () => {
    const { extractCodes } = await import("@/lib/gmail-sync");
    expect(extractCodes("Pay NYM-AB12-CD34 today")).toEqual(["NYM-AB12-CD34"]);
    expect(extractCodes("nym-ab12-cd34 and NYM-AB12-CD34")).toEqual(["NYM-AB12-CD34"]);
    expect(extractCodes("no codes")).toEqual([]);
  });

  it("parseSenderEmail parses angle-bracket form and strips quotes", async () => {
    const { parseSenderEmail } = await import("@/lib/gmail-sync");
    expect(parseSenderEmail(`Jane <User@Example.COM>`)).toBe("user@example.com");
    expect(parseSenderEmail(`"user@test.org"`)).toBe("user@test.org");
    expect(parseSenderEmail(null)).toBe("");
  });
});

describe("syncPaidSignupsFromGmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_OAUTH_CLIENT_ID = "id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "secret";
    delete process.env.GMAIL_SYNC_TEST_MODE;
    listMock.mockResolvedValue({ data: { messages: [{ id: "msg1" }] } });
    getMock.mockResolvedValue({
      data: {
        payload: {
          headers: [
            { name: "From", value: "Interac <notify@payments.interac.ca>" },
            { name: "Subject", value: "Payment NYM-ZZ99-WW88" },
          ],
        },
        snippet: "",
      },
    });
  });

  it("throws when Gmail not connected", async () => {
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const admin = {
      from: vi.fn(() =>
        thenable({ gmail_refresh_token: null, gmail_connected_email: null })
      ),
    };
    await expect(syncPaidSignupsFromGmail(admin as never, "http://localhost")).rejects.toThrow(
      "Gmail is not connected"
    );
  });

  it("returns 0 and updates settings when no Gmail hits", async () => {
    listMock.mockResolvedValueOnce({ data: { messages: [] } });
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const updateChain: Record<string, unknown> = {};
    updateChain.eq = vi.fn(() => updateChain);
    updateChain.then = (fn: (r: { data: null; error: null }) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(fn);
    const adminFrom = vi.fn((table: string) => {
      if (table === "admin_settings") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { gmail_refresh_token: "rt", gmail_connected_email: "a@b.com" },
                error: null,
              }),
            }),
          }),
          update: () => updateChain,
        };
      }
      return thenable(null);
    });
    const admin = { from: adminFrom };
    const n = await syncPaidSignupsFromGmail(admin as never, "http://localhost");
    expect(n).toBe(0);
    expect(updateChain.eq).toHaveBeenCalled();
  });

  it("matches code from Interac sender, updates signup, sends confirmation", async () => {
    const game: Game = {
      id: "game-1",
      location: "Gym",
      address: null,
      lat: null,
      lng: null,
      date: "2030-01-01",
      time: "18:00",
      cap: 12,
      price: 10,
      etransfer: "pay@test.com",
      listed: true,
    };
    const signupFull: Signup = {
      id: "su-1",
      game_id: game.id,
      name: "P",
      email: "player@example.com",
      paid: false,
      friends: [],
      payment_code: "NYM-ZZ99-WW88",
    };
    const pending = [
      {
        id: "su-1",
        game_id: game.id,
        email: "player@example.com",
        paid: false,
        payment_code: "nym-zz99-ww88",
      },
      {
        id: "su-2",
        game_id: game.id,
        email: "other@example.com",
        paid: false,
        payment_code: "NYM-AAAA-BBBB",
      },
    ];

    const updateSignup = vi.fn(() => ({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }));

    const adminFrom = vi.fn((table: string) => {
      if (table === "admin_settings") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { gmail_refresh_token: "rt", gmail_connected_email: "a@b.com" },
                error: null,
              }),
            }),
          }),
          update: () => {
            const c: Record<string, unknown> = {};
            c.eq = vi.fn(() => c);
            c.then = (fn: (r: { data: null; error: null }) => unknown) =>
              Promise.resolve({ data: null, error: null }).then(fn);
            return c;
          },
        };
      }
      if (table === "signups") {
        return {
          select: (cols: string) => {
            if (cols.includes("payment_code") && cols.includes("game_id")) {
              return {
                eq: () => ({
                  not: () => Promise.resolve({ data: pending, error: null }),
                }),
              };
            }
            return {
              eq: () => ({
                single: async () => ({ data: signupFull, error: null }),
              }),
            };
          },
          update: () => updateSignup(),
        };
      }
      if (table === "games") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: game, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });

    const admin = { from: adminFrom };
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const { sendTransactionalEmail } = await import("@/lib/notifications");

    const matched = await syncPaidSignupsFromGmail(admin as never, "http://localhost");
    expect(matched).toBe(1);
    expect(updateSignup).toHaveBeenCalled();
    expect(sendTransactionalEmail).toHaveBeenCalled();
  });

  it("skips when sender is not Interac in production mode", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        payload: {
          headers: [
            { name: "From", value: "Other <wrong@example.com>" },
            { name: "Subject", value: "NYM-ZZ99-WW88" },
          ],
        },
        snippet: "",
      },
    });
    const pending = [
      {
        id: "su-1",
        game_id: "g",
        email: "player@example.com",
        paid: false,
        payment_code: "NYM-ZZ99-WW88",
      },
    ];
    const adminFrom = vi.fn((table: string) => {
      if (table === "admin_settings") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { gmail_refresh_token: "rt", gmail_connected_email: null },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
      }
      if (table === "signups") {
        return {
          select: () => ({
            eq: () => ({
              not: () => Promise.resolve({ data: pending, error: null }),
            }),
          }),
        };
      }
      throw new Error(table);
    });
    const admin = { from: adminFrom };
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const n = await syncPaidSignupsFromGmail(admin as never, "http://localhost");
    expect(n).toBe(0);
  });

  it("in test mode, matches sender email against signup email", async () => {
    process.env.GMAIL_SYNC_TEST_MODE = "true";
    getMock.mockResolvedValueOnce({
      data: {
        payload: {
          headers: [
            { name: "From", value: "Player <player@example.com>" },
            { name: "Subject", value: "Payment NYM-ZZ99-WW88" },
          ],
        },
        snippet: "",
      },
    });
    const game: Game = {
      id: "game-1",
      location: "Gym",
      address: null,
      lat: null,
      lng: null,
      date: "2030-01-01",
      time: "18:00",
      cap: 12,
      price: 10,
      etransfer: "pay@test.com",
      listed: true,
    };
    const signupFull: Signup = {
      id: "su-1",
      game_id: game.id,
      name: "P",
      email: "player@example.com",
      paid: false,
      friends: [],
      payment_code: "NYM-ZZ99-WW88",
    };
    const pending = [
      {
        id: "su-1",
        game_id: game.id,
        email: "player@example.com",
        paid: false,
        payment_code: "nym-zz99-ww88",
      },
    ];

    const updateSignup = vi.fn(() => ({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }));

    const adminFrom = vi.fn((table: string) => {
      if (table === "admin_settings") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { gmail_refresh_token: "rt", gmail_connected_email: "a@b.com" },
                error: null,
              }),
            }),
          }),
          update: () => {
            const c: Record<string, unknown> = {};
            c.eq = vi.fn(() => c);
            c.then = (fn: (r: { data: null; error: null }) => unknown) =>
              Promise.resolve({ data: null, error: null }).then(fn);
            return c;
          },
        };
      }
      if (table === "signups") {
        return {
          select: (cols: string) => {
            if (cols.includes("payment_code") && cols.includes("game_id")) {
              return {
                eq: () => ({
                  not: () => Promise.resolve({ data: pending, error: null }),
                }),
              };
            }
            return {
              eq: () => ({
                single: async () => ({ data: signupFull, error: null }),
              }),
            };
          },
          update: () => updateSignup(),
        };
      }
      if (table === "games") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: game, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });

    const admin = { from: adminFrom };
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const matched = await syncPaidSignupsFromGmail(admin as never, "http://localhost");
    expect(matched).toBe(1);
    expect(updateSignup).toHaveBeenCalled();
  });
});
