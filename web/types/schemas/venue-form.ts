import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

const adminVenueFormFieldsSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    lat: z.string(),
    lng: z.string(),
    image_url: z.string(),
    is_featured: z.string(),
  })
  .superRefine((val, ctx) => {
    if (!val.name.trim()) {
      ctx.addIssue({ code: "custom", message: "Venue name is required.", path: ["name"] });
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

export type AdminVenueFormPayload = {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  is_featured: boolean;
};

export type ParsedAdminVenueForm = {
  id: string | null;
  payload: AdminVenueFormPayload;
};

function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function parseAdminVenueFormFromFormData(
  formData: FormData
): ActionResult<ParsedAdminVenueForm> {
  const raw = {
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    address: formString(formData, "address"),
    lat: formString(formData, "lat"),
    lng: formString(formData, "lng"),
    image_url: formString(formData, "image_url"),
    is_featured: formString(formData, "is_featured"),
  };

  const parsed = adminVenueFormFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid form.";
    return { ok: false, error: msg };
  }

  const val = parsed.data;
  const id = val.id.trim() || null;
  const name = val.name.trim();
  const addressRaw = val.address.trim();
  const latRaw = val.lat.trim();
  const lngRaw = val.lng.trim();
  const imageRaw = val.image_url.trim();
  const is_featured = formData.get("is_featured") === "on";
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;

  const payload: AdminVenueFormPayload = {
    name,
    address: addressRaw || null,
    lat: latRaw && Number.isFinite(lat) ? lat : null,
    lng: lngRaw && Number.isFinite(lng) ? lng : null,
    image_url: imageRaw || null,
    is_featured,
  };

  return { ok: true, data: { id, payload } };
}
