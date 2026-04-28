/**
 * One-time / dev: download first Google Places photo per venue into public/facilities/{slug}.jpg
 * Run from 6ixBack: `pnpm download-facility-images`
 *
 * IMPORTANT: Places Web Service (Find/Text/Details/Photo) must NOT use an HTTP referrer–restricted key.
 * Use a separate API key restricted by IP / server only, or unrestricted during local runs; browser keys get REQUEST_DENIED.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import { config } from "dotenv";

import { FACILITY_SPOTLIGHT_SEEDS } from "../src/data/facility-spotlights";

const root = process.cwd();
config({ path: join(root, ".env") });

function requiredKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    console.error("Missing GOOGLE_MAPS_API_KEY in .env");
    process.exit(1);
  }
  return key;
}

function buildPhotoUrl(apiKey: string, photoReference: string, maxWidth = 1200): string {
  const u = new URL("https://maps.googleapis.com/maps/api/place/photo");
  u.searchParams.set("maxwidth", String(maxWidth));
  u.searchParams.set("photo_reference", photoReference);
  u.searchParams.set("key", apiKey);
  return u.toString();
}

async function fetchPlaceDetails(
  apiKey: string,
  placeId: string
): Promise<{ ok: boolean; formattedAddress: string | null; photoReference: string | null }> {
  const u = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  u.searchParams.set("place_id", placeId);
  u.searchParams.set("fields", "formatted_address,photos");
  u.searchParams.set("key", apiKey);
  const res = await fetch(u.toString());
  const json = (await res.json()) as {
    status: string;
    result?: { formatted_address?: string; photos?: { photo_reference: string }[] };
  };
  if (json.status !== "OK" || !json.result) {
    return { ok: false, formattedAddress: null, photoReference: null };
  }
  return {
    ok: true,
    formattedAddress: json.result.formatted_address ?? null,
    photoReference: json.result.photos?.[0]?.photo_reference ?? null,
  };
}

async function findPlaceIdFromText(apiKey: string, query: string): Promise<string | null> {
  const u = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  u.searchParams.set("input", query);
  u.searchParams.set("inputtype", "textquery");
  u.searchParams.set("fields", "place_id");
  u.searchParams.set("locationbias", "circle:40000@43.75,-79.35");
  u.searchParams.set("key", apiKey);
  const res = await fetch(u.toString());
  const json = (await res.json()) as { status: string; candidates?: { place_id: string }[]; error_message?: string };
  if (json.status !== "OK" || !json.candidates?.[0]?.place_id) {
    if (json.status !== "ZERO_RESULTS") {
      console.warn(`FindPlaceFromText ${json.status}`, json.error_message ?? "");
    }
    return null;
  }
  return json.candidates[0].place_id;
}

async function textSearchPlaceId(apiKey: string, query: string): Promise<string | null> {
  const u = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  u.searchParams.set("query", query);
  u.searchParams.set("key", apiKey);
  const res = await fetch(u.toString());
  const json = (await res.json()) as { status: string; results?: { place_id: string }[]; error_message?: string };
  if (json.status !== "OK" || !json.results?.[0]?.place_id) {
    console.warn(`TextSearch ${json.status}`, json.error_message ?? "");
    return null;
  }
  return json.results[0].place_id;
}

async function downloadPhoto(apiKey: string, slug: string, findQuery: string, placeIdHint?: string): Promise<void> {
  const outDir = join(root, "public", "facilities");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${slug}.jpg`);

  let placeId = placeIdHint ?? null;
  if (!placeId) {
    placeId = await findPlaceIdFromText(apiKey, findQuery);
  }
  if (!placeId) {
    placeId = await textSearchPlaceId(apiKey, findQuery);
  }
  if (!placeId) {
    console.warn(`[skip] ${slug}: no place_id (Find + Text Search)`);
    return;
  }

  const d = await fetchPlaceDetails(apiKey, placeId);
  if (!d.ok) {
    console.warn(`[skip] ${slug}: Place Details status not OK for ${placeId}`);
    return;
  }
  if (d.formattedAddress) {
    console.log(`[address] ${slug}: ${d.formattedAddress}`);
  }
  if (!d.photoReference) {
    console.warn(`[skip] ${slug}: no photos on listing`);
    return;
  }

  const photoUrl = buildPhotoUrl(apiKey, d.photoReference);
  const imgRes = await fetch(photoUrl);
  if (!imgRes.ok) {
    console.warn(`[skip] ${slug}: photo fetch ${imgRes.status}`);
    return;
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  writeFileSync(outPath, buf);
  console.log(`[ok] ${slug} → ${outPath} (${buf.length} bytes)`);
}

async function main(): Promise<void> {
  const apiKey = requiredKey();
  for (const seed of FACILITY_SPOTLIGHT_SEEDS) {
    await downloadPhoto(apiKey, seed.slug, seed.findQuery, seed.placeId);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
