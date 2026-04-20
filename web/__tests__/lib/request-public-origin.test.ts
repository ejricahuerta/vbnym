import { describe, expect, it, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { publicOriginFromRequest } from "@/lib/request-public-origin";

describe("publicOriginFromRequest", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://vbnym.ednsy.com/";
    const req = new NextRequest("http://127.0.0.1:3000/auth/callback");
    expect(publicOriginFromRequest(req)).toBe("https://vbnym.ednsy.com");
  });

  it("uses NEXT_PUBLIC_SITE_URL when APP_URL unset", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
    const req = new NextRequest("http://localhost:3000/foo");
    expect(publicOriginFromRequest(req)).toBe("https://example.org");
  });

  it("uses VERCEL_URL when set", () => {
    process.env.VERCEL_URL = "my-app.vercel.app";
    const req = new NextRequest("http://127.0.0.1:3000/");
    expect(publicOriginFromRequest(req)).toBe("https://my-app.vercel.app");
  });

  it("uses X-Forwarded-* when env origins unset", () => {
    const req = new NextRequest("http://127.0.0.1:3000/auth/callback", {
      headers: {
        "x-forwarded-host": "vbnym.ednsy.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(publicOriginFromRequest(req)).toBe("https://vbnym.ednsy.com");
  });

  it("defaults forwarded proto to https", () => {
    const req = new NextRequest("http://127.0.0.1:3000/", {
      headers: { "x-forwarded-host": "vbnym.ednsy.com" },
    });
    expect(publicOriginFromRequest(req)).toBe("https://vbnym.ednsy.com");
  });

  it("falls back to request.url origin", () => {
    const req = new NextRequest("http://localhost:3000/app");
    expect(publicOriginFromRequest(req)).toBe("http://localhost:3000");
  });
});
