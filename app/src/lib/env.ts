export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

export function appOrigin(): string {
  return process.env.APP_ORIGIN?.trim() || "http://localhost:3000";
}

/** Use false on http://localhost so session cookies are stored; true in production over HTTPS. */
export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}
