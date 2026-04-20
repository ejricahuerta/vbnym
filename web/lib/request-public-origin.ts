import type { NextRequest } from "next/server";

/**
 * Browser-facing origin for redirects and OAuth callbacks.
 *
 * When the app runs behind a reverse proxy, `request.url` often reflects the
 * internal bind address (e.g. `http://localhost:3000`). Prefer `NEXT_PUBLIC_APP_URL`
 * in production, or ensure the proxy sets `X-Forwarded-Host` and `X-Forwarded-Proto`.
 */
export function publicOriginFromRequest(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl) return appUrl;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (siteUrl) return siteUrl;

  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedHost) {
    const proto =
      forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : "https";
    return `${proto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}
