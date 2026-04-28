import type { Game } from "@/types/vbnym";

export function normalizeGame(row: Game): Game {
  const dateStr =
    typeof row.date === "string" && row.date.length >= 10
      ? row.date.slice(0, 10)
      : row.date;
  return {
    ...row,
    date: dateStr,
    listed: row.listed !== false,
    price: Number(row.price),
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    venue_id: row.venue_id ?? null,
    end_time: row.end_time ?? null,
    court: row.court != null && String(row.court).trim() ? String(row.court).trim() : null,
  };
}
