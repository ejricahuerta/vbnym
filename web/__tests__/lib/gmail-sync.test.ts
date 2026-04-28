import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, Signup } from "@/types/vbnym";

const listMock = vi.fn();
const getMock = vi.fn();

vi.mock("googleapis", () => {
  class OAuth2Mock {
    setCredentials = vi.fn();
    generateAuthUrl = vi.fn(() => "https://oauth");
    getToken = vi.fn();
    getAccessToken = vi.fn().mockResolvedValue({ token: "access" });
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

vi.mock("@/lib/gmail-reauth-reminder", () => ({
  markGameGmailReauthRequiredAndNotify: vi.fn().mockResolvedValue(undefined),
  markUniversalGmailReauthRequiredAndNotify: vi.fn().mockResolvedValue(undefined),
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

describe("extractCodes and parseSenderEmail", () => {
  it("extractCodes finds NYM and 6IX codes and dedupes", async () => {
    const { extractCodes } = await import("@/lib/gmail-sync");
    expect(extractCodes("Pay NYM-AB12-CD34 and 6IX-ZZ99-WW88 today")).toEqual([
      "NYM-AB12-CD34",
      "6IX-ZZ99-WW88",
    ]);
    expect(extractCodes("6ix-ab12-cd34 and 6IX-AB12-CD34")).toEqual(["6IX-AB12-CD34"]);
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

  it("returns 0 when no pending signups", async () => {
    const adminFrom = vi.fn((table: string) => {
      if (table === "signups") {
        return {
          select: () => ({
            eq: () => ({
              not: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "admin_settings") {
        return {
          update: () => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const n = await syncPaidSignupsFromGmail({ from: adminFrom } as never, "http://localhost");
    expect(n).toBe(0);
  });

  it("returns 0 when pending signups exist but no usable Gmail inbox", async () => {
    const updateChain: Record<string, unknown> = {};
    updateChain.eq = vi.fn(() => updateChain);
    updateChain.then = (fn: (r: { data: null; error: null }) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(fn);
    const pending = [
      {
        id: "su-1",
        game_id: "g1",
        email: "p@example.com",
        paid: false,
        payment_code: "NYM-AA11-BB22",
      },
    ];
    const adminFrom = vi.fn((table: string) => {
      if (table === "signups") {
        return {
          select: () => ({
            eq: () => ({
              not: () => Promise.resolve({ data: pending, error: null }),
            }),
          }),
        };
      }
      if (table === "admin_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  gmail_refresh_token: null,
                  gmail_connected_email: null,
                  gmail_assumed_expires_at: null,
                  gmail_reauth_required: false,
                },
                error: null,
              }),
            }),
          }),
          update: () => updateChain,
        };
      }
      if (table === "game_email_sync_config") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const n = await syncPaidSignupsFromGmail({ from: adminFrom } as never, "http://localhost");
    expect(n).toBe(0);
  });

  it("returns 0 and updates settings when no Gmail hits", async () => {
    listMock.mockResolvedValueOnce({ data: { messages: [] } });
    const { syncPaidSignupsFromGmail } = await import("@/lib/gmail-sync");
    const settingsUpdate = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    const pending = [
      {
        id: "su-0",
        game_id: "g1",
        email: "p@example.com",
        paid: false,
        payment_code: "NYM-QQ11-RR22",
      },
    ];
    const adminFrom = vi.fn((table: string) => {
      if (table === "signups") {
        return {
          select: () => ({
            eq: () => ({
              not: () => Promise.resolve({ data: pending, error: null }),
            }),
          }),
        };
      }
      if (table === "admin_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  gmail_refresh_token: "rt",
                  gmail_connected_email: "a@b.com",
                  gmail_assumed_expires_at: null,
                  gmail_reauth_required: false,
                },
                error: null,
              }),
            }),
          }),
          update: settingsUpdate,
        };
      }
      if (table === "game_email_sync_config") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });
    const admin = { from: adminFrom };
    const n = await syncPaidSignupsFromGmail(admin as never, "http://localhost");
    expect(n).toBe(0);
    expect(settingsUpdate).toHaveBeenCalled();
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
              maybeSingle: async () => ({
                data: {
                  gmail_refresh_token: "rt",
                  gmail_connected_email: "a@b.com",
                  gmail_assumed_expires_at: null,
                  gmail_reauth_required: false,
                },
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
      if (table === "game_email_sync_config") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
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
              maybeSingle: async () => ({
                data: {
                  gmail_refresh_token: "rt",
                  gmail_connected_email: null,
                  gmail_assumed_expires_at: null,
                  gmail_reauth_required: false,
                },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
      }
      if (table === "game_email_sync_config") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
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
              maybeSingle: async () => ({
                data: {
                  gmail_refresh_token: "rt",
                  gmail_connected_email: "a@b.com",
                  gmail_assumed_expires_at: null,
                  gmail_reauth_required: false,
                },
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
      if (table === "game_email_sync_config") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
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
