/** Build UTC ISO from local date (YYYY-MM-DD) and time (HH:mm), same as host publish form. */
export function buildStartsAtIso(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return "";
  const d = new Date(`${dateStr}T${timeStr}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Local calendar date and clock time for editing a stored ISO instant. */
export function isoToLocalDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${y}-${mo}-${day}`, time: `${h}:${mi}` };
}
