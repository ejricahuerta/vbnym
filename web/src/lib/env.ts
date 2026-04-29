export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

/**
 * Canonical site origin (no trailing slash). `APP_ORIGIN` may be set as a bare hostname
 * (for example `6ixback.edmel.dev`); we prepend `https://` so `new URL()` and redirects work.
 */
export function appOrigin(): string {
  const raw = process.env.APP_ORIGIN?.trim();
  if (!raw) {
    return "http://localhost:3000";
  }
  const normalized = raw.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  if (/^(localhost|127\.0\.0\.1)(:|$)/i.test(normalized)) {
    return `http://${normalized}`;
  }
  return `https://${normalized}`;
}

/** Use false on http://localhost so session cookies are stored; true in production over HTTPS. */
export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}
