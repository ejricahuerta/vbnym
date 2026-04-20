/**
 * Public site origin from `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` only.
 * No `Host`, `X-Forwarded-*`, `VERCEL_URL`, or `request.url` inference — avoids
 * wrong origins behind reverse proxies and keeps Supabase OAuth redirects stable.
 *
 * For local dev without env, defaults to `http://localhost:3000`.
 */
export function configuredPublicOrigin(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl) return appUrl;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (siteUrl) return siteUrl;

  return "http://localhost:3000";
}
