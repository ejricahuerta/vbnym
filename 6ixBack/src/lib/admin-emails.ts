/** Comma-separated allowlist in `ADMIN_EMAILS`. */

export function getAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const normalized = part.trim().toLowerCase();
    if (normalized.includes("@")) set.add(normalized);
  }
  return set;
}

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  return getAdminEmailSet().has(normalized);
}
