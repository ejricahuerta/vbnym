import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

const adminGameFormFieldsSchema = z
  .object({
    id: z.string(),
    venue_id: z.string(),
    location: z.string(),
    date: z.string(),
    time: z.string(),
    end_time: z.string(),
    cap: z.string(),
    price: z.string(),
    etransfer: z.string(),
    address: z.string(),
    entry_instructions: z.string(),
    court: z.string(),
    lat: z.string(),
    lng: z.string(),
    visibility: z.string(),
    registration_opens_at: z.string(),
    admin_will_play: z.string(),
  })
  .superRefine((val, ctx) => {
    const location = val.location.trim();
    if (!location) {
      ctx.addIssue({ code: "custom", message: "Location is required.", path: ["location"] });
    }
    if (!val.date.trim()) {
      ctx.addIssue({ code: "custom", message: "Date is required.", path: ["date"] });
    }
    if (!val.time.trim()) {
      ctx.addIssue({ code: "custom", message: "Time is required.", path: ["time"] });
    }
    const endTimeRaw = val.end_time.trim();
    if (endTimeRaw) {
      if (!/^\d{2}:\d{2}$/.test(endTimeRaw)) {
        ctx.addIssue({ code: "custom", message: "Invalid end time.", path: ["end_time"] });
      } else {
        const a = hhmmToMinutes(val.time.trim());
        const b = hhmmToMinutes(endTimeRaw);
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          ctx.addIssue({ code: "custom", message: "Invalid time range.", path: ["time"] });
        } else if (b <= a) {
          ctx.addIssue({
            code: "custom",
            message: "End time must be after start time.",
            path: ["end_time"],
          });
        }
      }
    }
    if (!val.etransfer.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "E-transfer email is required.",
        path: ["etransfer"],
      });
    }
    const cap = Number(val.cap);
    const price = Number(val.price);
    if (!Number.isFinite(cap) || cap < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Cap must be a number and at least 2.",
        path: ["cap"],
      });
    }
    if (!Number.isFinite(price)) {
      ctx.addIssue({ code: "custom", message: "Invalid price.", path: ["price"] });
    }
    const latRaw = val.lat.trim();
    const lngRaw = val.lng.trim();
    const lat = latRaw ? Number(latRaw) : null;
    const lng = lngRaw ? Number(lngRaw) : null;
    if (latRaw && !Number.isFinite(lat)) {
      ctx.addIssue({ code: "custom", message: "Invalid latitude.", path: ["lat"] });
    }
    if (lngRaw && !Number.isFinite(lng)) {
      ctx.addIssue({ code: "custom", message: "Invalid longitude.", path: ["lng"] });
    }
  });

export type AdminGameFormPayload = {
  venue_id: string | null;
  location: string;
  address: string | null;
  date: string;
  time: string;
  end_time: string | null;
  cap: number;
  price: number;
  etransfer: string;
  lat: number | null;
  lng: number | null;
  listed: boolean;
  registration_opens_at: string | null;
  entry_instructions: string | null;
  court: string | null;
};

export type ParsedAdminGameForm = {
  id: string | null;
  admin_will_play: boolean;
  payload: AdminGameFormPayload;
};

function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function parseAdminGameFormFromFormData(
  formData: FormData
): ActionResult<ParsedAdminGameForm> {
  const raw = {
    id: formString(formData, "id"),
    venue_id: formString(formData, "venue_id"),
    location: formString(formData, "location"),
    date: formString(formData, "date"),
    time: formString(formData, "time"),
    end_time: formString(formData, "end_time"),
    cap: formString(formData, "cap"),
    price: formString(formData, "price"),
    etransfer: formString(formData, "etransfer"),
    address: formString(formData, "address"),
    entry_instructions: formString(formData, "entry_instructions"),
    court: formString(formData, "court"),
    lat: formString(formData, "lat"),
    lng: formString(formData, "lng"),
    visibility: formString(formData, "visibility"),
    registration_opens_at: formString(formData, "registration_opens_at"),
    admin_will_play: formString(formData, "admin_will_play"),
  };

  const parsed = adminGameFormFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid form.";
    return { ok: false, error: msg };
  }

  const val = parsed.data;
  const id = val.id.trim() || null;
  const venueIdRaw = val.venue_id.trim();
  const venue_id = venueIdRaw || null;
  const location = val.location.trim();
  const date = val.date.trim();
  const time = val.time.trim();
  const endTimeRaw = val.end_time.trim();
  const end_time = endTimeRaw && /^\d{2}:\d{2}$/.test(endTimeRaw) ? endTimeRaw : null;
  const cap = Number(val.cap);
  const price = Number(val.price);
  const etransfer = val.etransfer.trim();
  const addressRaw = val.address.trim();
  const entryRaw = val.entry_instructions.trim();
  const courtRaw = val.court.trim();
  const admin_will_play = val.admin_will_play === "on";
  const visibility = val.visibility.trim() || "public";
  const listed = visibility !== "invite";
  const opensRaw = val.registration_opens_at.trim();
  let registration_opens_at: string | null = null;
  if (opensRaw) {
    const d = new Date(opensRaw);
    if (!Number.isNaN(d.getTime())) registration_opens_at = d.toISOString();
  }
  const latRaw = val.lat.trim();
  const lngRaw = val.lng.trim();
  const latNum = latRaw ? Number(latRaw) : null;
  const lngNum = lngRaw ? Number(lngRaw) : null;

  const payload: AdminGameFormPayload = {
    venue_id,
    location,
    address: addressRaw || null,
    date,
    time,
    end_time,
    cap,
    price,
    etransfer,
    lat: latRaw && Number.isFinite(latNum) ? latNum : null,
    lng: lngRaw && Number.isFinite(lngNum) ? lngNum : null,
    listed,
    registration_opens_at,
    entry_instructions: entryRaw || null,
    court: courtRaw || null,
  };

  return { ok: true, data: { id, admin_will_play, payload } };
}
