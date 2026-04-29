import { beforeEach, vi } from "vitest";

beforeEach(() => {
  process.env.CRON_SECRET = "test-secret";
  vi.restoreAllMocks();
});
