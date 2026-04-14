"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";

type VenuePayload = {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  is_featured: boolean;
};

function parseVenueForm(formData: FormData):
  | { ok: false; error: string }
  | { ok: true; id: string | null; payload: VenuePayload } {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const addressRaw = String(formData.get("address") ?? "").trim();
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const imageRaw = String(formData.get("image_url") ?? "").trim();
  const is_featured = formData.get("is_featured") === "on";

  if (!name) {
    return { ok: false, error: "Venue name is required." };
  }

  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  if (latRaw && !Number.isFinite(lat)) {
    return { ok: false, error: "Invalid latitude." };
  }
  if (lngRaw && !Number.isFinite(lng)) {
    return { ok: false, error: "Invalid longitude." };
  }

  return {
    ok: true,
    id,
    payload: {
      name,
      address: addressRaw || null,
      lat: latRaw && Number.isFinite(lat) ? lat : null,
      lng: lngRaw && Number.isFinite(lng) ? lng : null,
      image_url: imageRaw || null,
      is_featured,
    },
  };
}

export async function createVenue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false as const, error: "Admin login required." };
  }

  const parsed = parseVenueForm(formData);
  if (!parsed.ok) return parsed;

  if (parsed.payload.is_featured) {
    await supabase.from("venues").update({ is_featured: false });
  }

  const { error } = await supabase.from("venues").insert(parsed.payload as never);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/venues");
  revalidatePath("/admin/games");
  revalidatePath("/", "page");
  return { ok: true as const };
}

export async function updateVenue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false as const, error: "Admin login required." };
  }

  const parsed = parseVenueForm(formData);
  if (!parsed.ok) return parsed;
  if (!parsed.id) {
    return { ok: false as const, error: "Missing venue id." };
  }

  if (parsed.payload.is_featured) {
    await supabase.from("venues").update({ is_featured: false });
  }

  const { error } = await supabase
    .from("venues")
    .update(parsed.payload as never)
    .eq("id", parsed.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/venues");
  revalidatePath("/admin/games");
  revalidatePath(`/admin/venues/${parsed.id}/edit`);
  revalidatePath("/", "page");
  return { ok: true as const };
}

export async function deleteVenue(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return;

  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) {
    console.error(error.message);
    return;
  }

  revalidatePath("/admin/venues");
  revalidatePath("/admin/games");
  revalidatePath("/", "page");
}
