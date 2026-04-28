/**
 * Opens Google Maps directions to a place (coordinates preferred, else address or label).
 * Returns null when there is nothing usable to navigate to.
 */
export function googleDirectionsUrlFromPlace(p: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  label?: string | null;
}): string | null {
  const lat = p.lat != null && Number.isFinite(Number(p.lat)) ? Number(p.lat) : null;
  const lng = p.lng != null && Number.isFinite(Number(p.lng)) ? Number(p.lng) : null;
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const addr = typeof p.address === "string" ? p.address.trim() : "";
  const label = typeof p.label === "string" ? p.label.trim() : "";
  const dest = addr || label;
  if (!dest) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}
