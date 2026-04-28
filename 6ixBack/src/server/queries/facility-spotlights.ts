import "server-only";

import { cache } from "react";

import { FACILITY_SPOTLIGHT_SEEDS } from "@/data/facility-spotlights";
import type { FacilitySpotlight } from "@/types/schemas/facility-spotlight";

function buildSpotlightFromSeed(seed: (typeof FACILITY_SPOTLIGHT_SEEDS)[number]): FacilitySpotlight {
  return {
    ...seed,
    photoUrl: `/facilities/${seed.slug}.jpg`,
    formattedAddress: seed.address ?? null,
    resolvedPlaceId: seed.placeId ?? null,
  };
}

export const getFacilitySpotlights = cache(async (): Promise<FacilitySpotlight[]> => {
  return FACILITY_SPOTLIGHT_SEEDS.map(buildSpotlightFromSeed);
});
