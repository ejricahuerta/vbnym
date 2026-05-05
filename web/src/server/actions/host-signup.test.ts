/**
 * Repo SQL migrations: no CREATE TRIGGER or CREATE POLICY on `6ixback.signups`.
 * If multiple rows still change in production, inspect the hosted Supabase project
 * (Dashboard → Database → Triggers / Policies) for objects not tracked in this repo.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveHostedGameManagement: vi.fn(),
  createServerSupabase: vi.fn(),
  revalidatePath: vi.fn(),
  sendTransactionalEmailResult: vi.fn(),
  createPlayerCancelSignupLinkToken: vi.fn(),
  appOrigin: vi.fn(),
  hostGmailConnectionId: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  resolveHostedGameManagement: mocks.resolveHostedGameManagement,
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: mocks.createServerSupabase,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/send-email", () => ({
  sendTransactionalEmailResult: mocks.sendTransactionalEmailResult,
}));

vi.mock("@/lib/magic-link", () => ({
  createPlayerCancelSignupLinkToken: mocks.createPlayerCancelSignupLinkToken,
}));

vi.mock("@/lib/env", () => ({
  appOrigin: mocks.appOrigin,
}));

vi.mock("@/lib/host-gmail", () => ({
  hostGmailConnectionId: mocks.hostGmailConnectionId,
}));

import { setSignupPaymentStatusForHost, setSignupRosterStatusForHost } from "./host-signup";

/** RFC9562 version-4 UUIDs (Zod `z.string().uuid()` rejects malformed strings). */
const GAME_ID = "00000000-0000-4000-8000-000000000001";
const SIGNUP_ID_A = "00000000-0000-4000-8000-000000000002";
const SIGNUP_ID_B = "00000000-0000-4000-8000-000000000003";
const HOST_SESSION = "host@example.com";
const SHARED_EMAIL = "parent@example.com";

type QueuedFrom =
  | { kind: "games_select_host"; game: Record<string, unknown> }
  | { kind: "signups_select_full"; signup: Record<string, unknown> }
  | { kind: "signups_update_return_id"; signupId: string; captureEqId?: { id: string | null } }
  | { kind: "games_update_counts" }
  | { kind: "signups_select_roster"; signup: Record<string, unknown> }
  | { kind: "games_select_roster"; game: Record<string, unknown> }
  | { kind: "gmail_connections_select"; hasConnection: boolean };

function createQueuedSupabase(queue: QueuedFrom[]): { from: ReturnType<typeof vi.fn> } {
  let q = 0;
  const from = vi.fn((table: string) => {
    const item = queue[q];
    if (!item) {
      throw new Error(`Unexpected from("${table}") — queue exhausted at index ${q}`);
    }
    if (table === "games") {
      if (item.kind === "games_select_host" || item.kind === "games_select_roster") {
        q += 1;
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: item.game, error: null }),
            }),
          }),
        };
      }
      if (item.kind === "games_update_counts") {
        q += 1;
        return {
          update: () => ({
            eq: () => ({ error: null }),
          }),
        };
      }
    }
    if (table === "signups") {
      if (item.kind === "signups_select_full" || item.kind === "signups_select_roster") {
        q += 1;
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: item.signup, error: null }),
              }),
            }),
          }),
        };
      }
      if (item.kind === "signups_update_return_id") {
        q += 1;
        return {
          update: () => ({
            eq: (col: string, val: unknown) => {
              if (col === "id" && item.captureEqId) {
                item.captureEqId.id = typeof val === "string" ? val : null;
              }
              return {
                eq: () => ({
                  select: () => ({
                    maybeSingle: async () => ({ data: { id: item.signupId }, error: null }),
                  }),
                }),
              };
            },
          }),
        };
      }
    }
    if (table === "gmail_connections" && item.kind === "gmail_connections_select") {
      q += 1;
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: item.hasConnection ? { id: "conn" } : null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    throw new Error(`Unhandled from("${table}") with queue item ${JSON.stringify(item)}`);
  });
  return { from };
}

describe("host-signup server actions", () => {
  beforeEach(() => {
    mocks.resolveHostedGameManagement.mockReset();
    mocks.createServerSupabase.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.sendTransactionalEmailResult.mockReset();
    mocks.createPlayerCancelSignupLinkToken.mockReset();
    mocks.appOrigin.mockReset();
    mocks.hostGmailConnectionId.mockReset();
    mocks.resolveHostedGameManagement.mockResolvedValue({
      ok: true,
      hostSessionEmail: HOST_SESSION,
      isAdmin: false,
    });
    mocks.appOrigin.mockReturnValue("http://localhost:3000");
    mocks.hostGmailConnectionId.mockReturnValue("host:test");
  });

  it("setSignupPaymentStatusForHost(refund) updates exactly one signup row by id (shared-email group scenario)", async () => {
    const captureEqId = { id: null as string | null };
    const game = {
      id: GAME_ID,
      title: "Test game",
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      host_name: "Host",
      host_email: "interac@host.com",
      price_cents: 1500,
      owner_email: HOST_SESSION,
      signed_count: 2,
      waitlist_count: 0,
      capacity: 18,
      organizations: { name: "Org" },
    };
    const signup = {
      id: SIGNUP_ID_B,
      player_name: "Guest Two",
      player_email: SHARED_EMAIL,
      payment_status: "paid" as const,
      status: "active" as const,
      payment_code: "6B-ABCD-EFGH-2",
      added_by_name: "Parent",
      refund_owner_name: "Parent",
      organizations: { name: "Org" },
    };
    mocks.createServerSupabase.mockReturnValue(
      createQueuedSupabase([
        { kind: "games_select_host", game },
        { kind: "signups_select_full", signup },
        { kind: "signups_update_return_id", signupId: SIGNUP_ID_B, captureEqId },
        { kind: "games_update_counts" },
      ])
    );

    const fd = new FormData();
    fd.set("gameId", GAME_ID);
    fd.set("signupId", SIGNUP_ID_B);
    fd.set("paymentStatus", "refund");

    const res = await setSignupPaymentStatusForHost(fd);
    expect(res).toEqual({ ok: true, data: null });
    expect(captureEqId.id).toBe(SIGNUP_ID_B);
    expect(captureEqId.id).not.toBe(SIGNUP_ID_A);
  });

  it("setSignupRosterStatusForHost(removed) scopes update to the requested signupId only", async () => {
    const captureEqId = { id: null as string | null };
    const game = {
      id: GAME_ID,
      owner_email: HOST_SESSION,
      capacity: 18,
      signed_count: 2,
      waitlist_count: 0,
    };
    const signup = {
      id: SIGNUP_ID_B,
      status: "active" as const,
      payment_status: "refund" as const,
    };
    mocks.createServerSupabase.mockReturnValue(
      createQueuedSupabase([
        { kind: "games_select_roster", game },
        { kind: "signups_select_roster", signup },
        { kind: "signups_update_return_id", signupId: SIGNUP_ID_B, captureEqId },
        { kind: "games_update_counts" },
      ])
    );

    const fd = new FormData();
    fd.set("gameId", GAME_ID);
    fd.set("signupId", SIGNUP_ID_B);
    fd.set("status", "removed");

    const res = await setSignupRosterStatusForHost(fd);
    expect(res).toEqual({ ok: true, data: null });
    expect(captureEqId.id).toBe(SIGNUP_ID_B);
  });

  it("setSignupPaymentStatusForHost returns error when update affects zero rows", async () => {
    const game = {
      id: GAME_ID,
      title: "Test game",
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      host_name: "Host",
      host_email: "interac@host.com",
      price_cents: 1500,
      owner_email: HOST_SESSION,
      signed_count: 1,
      waitlist_count: 0,
      capacity: 18,
      organizations: { name: "Org" },
    };
    const signup = {
      id: SIGNUP_ID_B,
      player_name: "Guest",
      player_email: SHARED_EMAIL,
      payment_status: "paid" as const,
      status: "active" as const,
      payment_code: "6B-ABCD-EFGH",
      added_by_name: "Parent",
      refund_owner_name: "Parent",
      organizations: { name: "Org" },
    };
    let q = 0;
    mocks.createServerSupabase.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "games" && q === 0) {
          q += 1;
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: game, error: null }),
              }),
            }),
          };
        }
        if (table === "signups" && q === 1) {
          q += 1;
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: signup, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "signups" && q === 2) {
          q += 1;
          return {
            update: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected from(${table}) at step ${q}`);
      }),
    });

    const fd = new FormData();
    fd.set("gameId", GAME_ID);
    fd.set("signupId", SIGNUP_ID_B);
    fd.set("paymentStatus", "refund");

    const res = await setSignupPaymentStatusForHost(fd);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe("Sign-up not found or could not be updated.");
    }
  });
});
