import { afterEach, describe, expect, it } from "vitest";

import { configuredPublicOrigin } from "@/lib/configured-public-origin";

describe("configuredPublicOrigin", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://vbnym.ednsy.com/";
    expect(configuredPublicOrigin()).toBe("https://vbnym.ednsy.com");
  });

  it("uses NEXT_PUBLIC_SITE_URL when APP_URL unset", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
    expect(configuredPublicOrigin()).toBe("https://example.org");
  });

  it("prefers NEXT_PUBLIC_APP_URL over SITE_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example/";
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example";
    expect(configuredPublicOrigin()).toBe("https://app.example");
  });

  it("ignores VERCEL_URL and falls back to localhost when env origins unset", () => {
    process.env.VERCEL_URL = "my-app.vercel.app";
    expect(configuredPublicOrigin()).toBe("http://localhost:3000");
  });

  it("falls back to localhost when no env origin", () => {
    expect(configuredPublicOrigin()).toBe("http://localhost:3000");
  });
});
