import "server-only";

import { cache } from "react";

import type { Venue } from "@/types/vbnym";
import { createClient } from "@/lib/supabase/server";

export function normalizeVenue(row: Venue): Venue {
  return {
    ...row,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    image_url:
      row.image_url != null && String(row.image_url).trim()
        ? String(row.image_url).trim()
        : null,
    is_featured: row.is_featured === true,
  };
}

export const getVenueById = cache(async (id: string): Promise<Venue | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return normalizeVenue(data as Venue);
  } catch {
    return null;
  }
});

export const getVenues = cache(async (): Promise<{ venues: Venue[]; error: string | null }> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      return { venues: [], error: error.message };
    }
    return {
      venues: ((data ?? []) as Venue[]).map(normalizeVenue),
      error: null,
    };
  } catch (e) {
    return {
      venues: [],
      error: e instanceof Error ? e.message : "Could not load venues.",
    };
  }
});
