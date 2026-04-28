/** Parse `YYYY-MM-DD` from DB into a local calendar date (no UTC shift). */
export function parseGameDateString(
  raw: string | null | undefined
): Date | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw.trim().split("-");
  if (parts.length !== 3) return undefined;
  const y = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1], 10);
  const d = Number.parseInt(parts[2], 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return undefined;
  return new Date(y, m - 1, d);
}
