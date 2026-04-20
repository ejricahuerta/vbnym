type AppMetadata = {
  provider?: string;
  providers?: string[];
};

type AuthUserLike = {
  app_metadata?: AppMetadata;
  email?: string | null;
} | null | undefined;

const ADMIN_ORG_DOMAIN = "@ednsy.com";

export function isAdminUser(user: AuthUserLike): boolean {
  if (!user) return false;
  const appMetadata = user.app_metadata ?? {};
  if (appMetadata.provider === "google") return true;
  return Array.isArray(appMetadata.providers) && appMetadata.providers.includes("google");
}

function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Comma-separated `ADMIN_EMAILS` env (trimmed, lowercased entries).
 * Used for admin-only notifications and as the explicit allowlist alongside `@ednsy.com`.
 */
export function getAdminExplicitEmailAllowlist(): string[] {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}

/**
 * Whether this address may use organizer admin: any `@ednsy.com` inbox, or an exact match
 * in `ADMIN_EMAILS` (comma-separated server env). Same rule for the pre–Google email step and
 * after OAuth in `/auth/callback`.
 */
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith(ADMIN_ORG_DOMAIN)) return true;
  const extra = parseAdminEmails(process.env.ADMIN_EMAILS);
  return extra.includes(normalized);
}

/** Google OAuth session for a user allowed to use organizer admin. */
export function isAuthorizedAdmin(
  user: AuthUserLike
): user is NonNullable<AuthUserLike> {
  return isAdminUser(user) && isAllowedAdminEmail(user?.email);
}
