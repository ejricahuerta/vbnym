import { NextRequest } from "next/server";
import { expect } from "vitest";

type BuildRequestInput = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
};

export function buildRequest(input: BuildRequestInput): NextRequest {
  return new NextRequest(input.url, {
    method: input.method ?? "GET",
    headers: input.headers,
  });
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function expectRedirectTo(response: Response, expected: string): void {
  expect(response.status).toBeGreaterThanOrEqual(300);
  expect(response.status).toBeLessThan(400);
  expect(response.headers.get("location")).toBe(expected);
}
