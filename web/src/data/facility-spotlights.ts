import type { FacilitySpotlightSeed } from "@/types/schemas/facility-spotlight";

/** Curated indoor hardwood gyms; landing card images are JPEGs at `public/facilities/{slug}.jpg` (same filename as each slug). */
export const FACILITY_SPOTLIGHT_SEEDS: FacilitySpotlightSeed[] = [
  {
    slug: "hangar-toronto-volleyball-centre",
    area: "north-york",
    displayName: "The Hangar Sports & Events Centre",
    findQuery: "The Hangar Sports and Events Centre 75 Carl Hall Rd North York ON M3K 2B9",
    teaser: "Major hardwood footprint → drop-ins, clubs, and co-ed 6s-friendly programs.",
    address: "75 Carl Hall Rd, North York, ON M3K 2B9",
  },
  {
    slug: "la-liga-sports-complex",
    area: "north-york",
    displayName: "La Liga Sports Complex",
    findQuery: "La Liga Sports Complex 1107 Finch Ave W North York ON M3J 2P7",
    teaser: "Three hardwood courts with hourly rentals → indoor 6s all year.",
    address: "1107 Finch Ave W, North York, ON M3J 2P7",
  },
  {
    slug: "edithvale-community-centre",
    area: "north-york",
    displayName: "Edithvale Community Centre",
    findQuery: "Edithvale Community Centre 131 Finch Ave W North York ON M2N 2H8",
    teaser: "City double gym → permits and indoor drop-in volleyball.",
    address: "131 Finch Ave W, North York, ON M2N 2H8",
  },
  {
    slug: "weplay-sports-centre",
    area: "markham",
    displayName: "WePlay Sports Centre",
    findQuery: "WePlay Sports Centre 100 Clegg Rd Markham ON L6G 1E1",
    teaser: "Six full indoor hardwood courts → leagues and rentals in downtown Markham.",
    address: "100 Clegg Rd, Markham, ON L6G 1E1",
  },
  {
    slug: "markham-pan-am-centre",
    area: "markham",
    displayName: "Markham Pan Am Centre",
    findQuery: "Markham Pan Am Centre 16 Main Street Unionville Markham ON L3R 2E4",
    teaser: "International-standard gymnasium → volleyball among many sports.",
    address: "16 Main St Unionville, Markham, ON L3R 2E4",
  },
  {
    slug: "icm-sports-complex",
    area: "markham",
    displayName: "ICM Sports Complex",
    findQuery: "ICM Sports Complex Markham Ontario volleyball",
    teaser: "Multi-sport facility with a dedicated indoor volleyball court.",
    address: "Markham, ON",
  },
];
