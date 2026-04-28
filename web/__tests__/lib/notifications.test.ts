import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sendTransactionalEmail", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns without calling fetch when RESEND_API_KEY is missing", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    const { sendTransactionalEmail } = await import("@/lib/notifications");
    await expect(
      sendTransactionalEmail({
        to: "a@b.com",
        subject: "S",
        html: "<p>x</p>",
      })
    ).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POSTs to Resend when key is set", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "Custom <custom@x.com>";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "em_1" }),
    });
    globalThis.fetch = fetchSpy;
    const { sendTransactionalEmail } = await import("@/lib/notifications");
    await sendTransactionalEmail({
      to: "user@y.com",
      subject: "Hello",
      html: "<p>H</p>",
      text: "H",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test",
        }),
      })
    );
    const body = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(body.from).toBe("Custom <custom@x.com>");
    expect(body.to).toEqual(["user@y.com"]);
    expect(body.text).toBe("H");
  });

  it("does not throw on non-OK response", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "bad" } }),
    });
    globalThis.fetch = fetchSpy;
    const { sendTransactionalEmail } = await import("@/lib/notifications");
    await expect(
      sendTransactionalEmail({ to: "a@b.com", subject: "S", html: "h" })
    ).resolves.toBeUndefined();
  });

  it("does not throw on fetch rejection", async () => {
    process.env.RESEND_API_KEY = "re_test";
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));
    const { sendTransactionalEmail } = await import("@/lib/notifications");
    await expect(
      sendTransactionalEmail({ to: "a@b.com", subject: "S", html: "h" })
    ).resolves.toBeUndefined();
  });

  it("uses default from when RESEND_FROM_EMAIL unset", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    globalThis.fetch = fetchSpy;
    const { sendTransactionalEmail } = await import("@/lib/notifications");
    await sendTransactionalEmail({ to: "a@b.com", subject: "S", html: "h" });
    const body = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(body.from).toBe("6IX BACK Volleyball <play@6ixback.com>");
  });
});
