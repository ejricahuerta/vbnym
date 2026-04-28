/** Local defaults when a venue has no uploaded / Google photo URL. */
const VENUE_PLACEHOLDER_IMAGES = [
  "/vball-court-1.jpg",
  "/vball-court-2.jpg",
  "/vball-court-3.jpg",
] as const;

/**
 * Returns the stored venue image URL, or a stable “random” pick from
 * {@link VENUE_PLACEHOLDER_IMAGES} based on `seed` (same seed → same image).
 */
export function venueImageOrPlaceholder(
  storedUrl: string | null | undefined,
  seed: string
): string {
  const t = storedUrl?.trim();
  if (t) return t;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h, 31) + seed.charCodeAt(i);
    h |= 0;
  }
  const idx = Math.abs(h) % VENUE_PLACEHOLDER_IMAGES.length;
  return VENUE_PLACEHOLDER_IMAGES[idx]!;
}
