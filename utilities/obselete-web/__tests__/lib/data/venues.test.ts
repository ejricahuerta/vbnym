import { describe, expect, it } from "vitest";
import { normalizeVenue } from "@/server/queries/venues";
import type { Venue } from "@/types/vbnym";

describe("normalizeVenue", () => {
  it("coerces lat/lng to number", () => {
    const v = normalizeVenue({
      id: "1",
      name: "Court",
      address: null,
      lat: "43.7" as unknown as number,
      lng: "-79.4" as unknown as number,
    } as Venue);
    expect(v.lat).toBe(43.7);
    expect(v.lng).toBe(-79.4);
  });

  it("nullifies empty image_url", () => {
    expect(
      normalizeVenue({
        id: "1",
        name: "Court",
        address: null,
        lat: null,
        lng: null,
        image_url: "  ",
      } as Venue).image_url
    ).toBeNull();
  });

  it("defaults is_featured false", () => {
    const v = normalizeVenue({
      id: "1",
      name: "Court",
      address: null,
      lat: null,
      lng: null,
    } as Venue);
    expect(v.is_featured).toBe(false);
  });
});
