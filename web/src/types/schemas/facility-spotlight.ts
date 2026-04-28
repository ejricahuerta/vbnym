import { z } from "zod";

/** Curated landing-page row (static fields before Places enrichment). */
export const facilitySpotlightSeedSchema = z.object({
  slug: z.string().min(1),
  area: z.enum(["north-york", "markham"]),
  displayName: z.string().min(1),
  /** Optional verified Google Place ID (skips Find Place From Text when set and valid). */
  placeId: z.string().min(1).optional(),
  /** Unique text query for Find Place From Text when placeId is missing or invalid. */
  findQuery: z.string().min(1),
  teaser: z.string().min(1),
  /** Static formatted address for display (optional; fill from Places or manually). */
  address: z.string().min(1).optional(),
});

export type FacilitySpotlightSeed = z.infer<typeof facilitySpotlightSeedSchema>;

/** Enriched row returned from `getFacilitySpotlights` (local photo path + optional static address). */
export const facilitySpotlightSchema = facilitySpotlightSeedSchema.extend({
  /** Public path under `public/facilities/` (bundled JPEG per slug). */
  photoUrl: z.string().min(1),
  formattedAddress: z.string().min(1).nullable(),
  /** From Find Place / Details; drives “open in Maps” when present. */
  resolvedPlaceId: z.string().min(1).nullable(),
});

export type FacilitySpotlight = z.infer<typeof facilitySpotlightSchema>;
