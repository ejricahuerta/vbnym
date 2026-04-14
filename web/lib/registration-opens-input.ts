import type { TimeParts } from "@/lib/game-time-input";

const DEFAULT_REG_TIME: TimeParts = { hour: 9, minute: 0 };

/** Convert DB timestamptz to `datetime-local` input value (local timezone). */
export function registrationOpensToInputValue(
  iso: string | null | undefined
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

/** Split timestamptz into calendar date + local clock for pickers. */
export function parseRegistrationOpensForPicker(
  iso: string | null | undefined
): { date: Date | undefined; time: TimeParts } {
  if (!iso) return { date: undefined, time: { ...DEFAULT_REG_TIME } };
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime()))
    return { date: undefined, time: { ...DEFAULT_REG_TIME } };
  return {
    date: new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()),
    time: { hour: dt.getHours(), minute: dt.getMinutes() },
  };
}

/** Build ISO string for the server from local calendar date + time-of-day. */
export function localDateTimeToISO(date: Date, time: TimeParts): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hour,
    time.minute,
    0,
    0
  ).toISOString();
}
