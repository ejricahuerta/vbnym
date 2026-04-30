import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: mocks.createServerSupabase,
}));

vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return {
    ...actual,
    appOrigin: () => "http://localhost:3000",
    requiredEnv: (key: string) => `mock-${key}`,
  };
});

import { syncPaidSignupsFromGmail } from "./gmail";

describe("syncPaidSignupsFromGmail (host-scoped)", () => {
  it("returns zeros when no live games", async () => {
    const fromMock = vi.fn((table: string) => {
      if (table === "games") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [] })),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    mocks.createServerSupabase.mockReturnValueOnce({ from: fromMock });

    const result = await syncPaidSignupsFromGmail();
    expect(result).toEqual({ matched: 0, expired: 0, reminded: 0 });
  });

  it("groups multiple games for the same host and queries one host:<email> connection", async () => {
    const inArgs: string[][] = [];

    const fromMock = vi.fn((table: string) => {
      if (table === "games") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "g1", host_email: "Host@Example.com" },
                  { id: "g2", host_email: "host@example.com" },
                ],
              })
            ),
          })),
        };
      }
      if (table === "gmail_connections") {
        return {
          select: vi.fn(() => ({
            in: vi.fn((_col: string, ids: string[]) => {
              inArgs.push([...ids]);
              return {
                eq: vi.fn(() => Promise.resolve({ data: [] })),
              };
            }),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    mocks.createServerSupabase.mockReturnValueOnce({ from: fromMock });

    const result = await syncPaidSignupsFromGmail();

    expect(result).toEqual({ matched: 0, expired: 0, reminded: 0 });
    expect(inArgs).toEqual([["host:host@example.com"]]);
  });

  it("returns zeros when host games exist but no host has an active connection", async () => {
    const fromMock = vi.fn((table: string) => {
      if (table === "games") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "g1", host_email: "a@example.com" },
                  { id: "g2", host_email: "b@example.com" },
                ],
              })
            ),
          })),
        };
      }
      if (table === "gmail_connections") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [] })),
            })),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    mocks.createServerSupabase.mockReturnValueOnce({ from: fromMock });

    const result = await syncPaidSignupsFromGmail();
    expect(result).toEqual({ matched: 0, expired: 0, reminded: 0 });
  });
});
