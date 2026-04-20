import "server-only";

/** Game `date` values are local calendar days for this region. */
const DEFAULT_CALENDAR_TIMEZONE = "America/Toronto";

/**
 * Returns `YYYY-MM-DD` for “today” in the listing calendar timezone (not UTC midnight),
 * so evening local games are not dropped when UTC has already rolled to the next date.
 */
export function todayIsoDateInCalendarTz(): string {
  const tz =
    process.env.VBNYM_CALENDAR_TIMEZONE?.trim() || DEFAULT_CALENDAR_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) {
    return new Date().toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}
