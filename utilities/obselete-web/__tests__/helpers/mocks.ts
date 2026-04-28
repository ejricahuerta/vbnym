import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MockDbResult = { data: unknown; error: { message: string } | null };

/**
 * Queue of `{ data, error }` responses for each awaited terminal on the fluent client
 * (`single`, `maybeSingle`, or bare `then` on a select chain).
 */
export function createQueuedSupabaseMock(initial: MockDbResult[] = []) {
  const queue = [...initial];

  const dequeue = (): MockDbResult =>
    queue.length > 0
      ? queue.shift()!
      : { data: null, error: { message: "Supabase mock queue empty" } };

  const terminal = () => Promise.resolve(dequeue());

  const fluent = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const self = () => chain;
    for (const method of [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "not",
      "is",
      "lt",
      "lte",
      "gt",
      "gte",
      "in",
      "order",
      "limit",
    ]) {
      chain[method] = vi.fn(self);
    }
    chain.single = vi.fn(terminal);
    chain.maybeSingle = vi.fn(terminal);
    chain.then = (onFulfilled: (v: MockDbResult) => unknown, onRejected?: (e: unknown) => unknown) =>
      terminal().then(onFulfilled, onRejected);
    return chain;
  };

  const client = {
    from: vi.fn(() => fluent()),
    rpc: vi.fn(() => terminal()),
  };

  return {
    client: client as unknown as SupabaseClient,
    push: (...results: MockDbResult[]) => {
      queue.push(...results);
    },
    /** Override queued behaviour for `rpc` (e.g. signup action). */
    setRpcResult: (result: MockDbResult) => {
      client.rpc.mockImplementation(() => Promise.resolve(result));
    },
    /** @internal */
    _queueLength: () => queue.length,
  };
}
