"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsPlaces } from "@/lib/load-google-maps";

type Refs = {
  addressRef: React.RefObject<HTMLInputElement | null>;
  locationRef: React.RefObject<HTMLInputElement | null>;
  latRef: React.RefObject<HTMLInputElement | null>;
  lngRef: React.RefObject<HTMLInputElement | null>;
  /** When set, first Google Places photo URL is written here on suggestion pick (venues). */
  imageUrlRef?: React.RefObject<HTMLInputElement | null>;
};

function clearAutocompleteInstance(ac: google.maps.places.Autocomplete | null) {
  if (ac && typeof google !== "undefined" && google.maps?.event) {
    google.maps.event.clearInstanceListeners(ac);
  }
}

/**
 * Attaches Google Places Autocomplete to `addressRef`. Re-binds when the
 * underlying input is remounted (e.g. Radix Collapsible unmounts content when closed).
 */
export function useGooglePlacesAutocomplete({
  addressRef,
  locationRef,
  latRef,
  lngRef,
  imageUrlRef,
}: Refs) {
  const cancelledRef = useRef(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [placesLoadError, setPlacesLoadError] = useState<string | null>(null);

  const mapsKeyMissing = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    cancelledRef.current = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let lastBound: HTMLInputElement | null = null;

    const detach = () => {
      clearAutocompleteInstance(autocompleteRef.current);
      autocompleteRef.current = null;
    };

    const syncBind = () => {
      if (cancelledRef.current) return;
      const el = addressRef.current;
      if (el === lastBound) return;
      detach();
      lastBound = el;
      if (!el) return;

      const fields: ("formatted_address" | "geometry" | "name" | "photos")[] = [
        "formatted_address",
        "geometry",
        "name",
      ];
      if (imageUrlRef) fields.push("photos");

      const autocomplete = new google.maps.places.Autocomplete(el, {
        fields,
      });
      autocompleteRef.current = autocomplete;
      autocomplete.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place?.geometry?.location || !addressRef.current) return;

        addressRef.current.value = place.formatted_address ?? "";
        if (latRef.current) {
          latRef.current.value = String(place.geometry.location.lat());
        }
        if (lngRef.current) {
          lngRef.current.value = String(place.geometry.location.lng());
        }
        if (
          locationRef.current &&
          !locationRef.current.value.trim() &&
          place.name
        ) {
          locationRef.current.value = place.name;
        }
        if (imageUrlRef?.current) {
          const photos = place.photos;
          if (photos && photos.length > 0) {
            const url = photos[0].getUrl({ maxWidth: 1600 });
            imageUrlRef.current.value = url;
          }
        }
      });
    };

    loadGoogleMapsPlaces(apiKey)
      .then(() => {
        if (cancelledRef.current) return;
        setPlacesLoadError(null);
        syncBind();
        pollInterval = setInterval(syncBind, 300);
      })
      .catch(() => {
        if (!cancelledRef.current) {
          setPlacesLoadError(
            "Could not load Google Maps. Check the API key and Places API."
          );
        }
      });

    return () => {
      cancelledRef.current = true;
      if (pollInterval) clearInterval(pollInterval);
      detach();
      lastBound = null;
    };
  }, [addressRef, locationRef, latRef, lngRef, imageUrlRef]);

  return { mapsKeyMissing, placesLoadError };
}
