/** Map stored or legacy display strings to `input[type=time]` value (HH:mm). */
export function gameTimeToTimeInputValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const t = raw.trim();

  const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = Number.parseInt(ampm[1], 10);
    const min = ampm[2];
    const ap = ampm[3].toUpperCase();
    if (!Number.isFinite(h) || min.length !== 2) return "";
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    if (h < 0 || h > 23) return "";
    return `${String(h).padStart(2, "0")}:${min}`;
  }

  const twentyFour = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const m24 = t.match(twentyFour);
  if (m24) {
    const h = Number.parseInt(m24[1], 10);
    const min = m24[2];
    if (!Number.isFinite(h) || min.length !== 2) return "";
    if (h < 0 || h > 23) return "";
    return `${String(h).padStart(2, "0")}:${min}`;
  }

  return "";
}

export type TimeParts = { hour: number; minute: number };

/** Default start time when no valid time is stored (evening slot). */
const DEFAULT_TIME: TimeParts = { hour: 19, minute: 0 };

/** Parse stored/legacy time into hour (0–23) and minute (0–59). */
export function parseGameTimeToParts(
  raw: string | null | undefined
): TimeParts {
  const normalized = gameTimeToTimeInputValue(raw);
  if (!normalized) return DEFAULT_TIME;
  const [hs, ms] = normalized.split(":");
  const hour = Number.parseInt(hs, 10);
  const minute = Number.parseInt(ms, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return DEFAULT_TIME;
  return {
    hour: Math.min(23, Math.max(0, hour)),
    minute: Math.min(59, Math.max(0, minute)),
  };
}

export function timePartsToHHmm({ hour, minute }: TimeParts): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Add minutes and normalize to 0–23h / 0–59m (same calendar day). */
export function addMinutesToTimeParts(
  parts: TimeParts,
  addMinutes: number
): TimeParts {
  let total = parts.hour * 60 + parts.minute + addMinutes;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(total / 60),
    minute: total % 60,
  };
}
