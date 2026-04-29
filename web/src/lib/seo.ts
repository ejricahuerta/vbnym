import type { Metadata } from "next";

import { appOrigin } from "@/lib/env";
import type { GameRow } from "@/types/domain";

const SITE_NAME = "6ix Back Volleyball";
const SITE_DESCRIPTION = "Drop-ins, leagues, and tournaments with Interac payment code matching.";
const DEFAULT_OG_IMAGE_PATH = "/6ix-back-logo.png";

function baseUrl(): URL {
  return new URL(appOrigin());
}

function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, baseUrl()).toString();
}

function trimDescription(description: string): string {
  if (description.length <= 160) return description;
  return `${description.slice(0, 157).trimEnd()}...`;
}

export function buildCanonical(pathname: string): string {
  return toAbsoluteUrl(pathname);
}

export function buildStaticMetadata({
  title,
  description,
  pathname,
  ogImagePath,
  keywords,
  noIndex = false,
}: {
  title: string;
  description: string;
  pathname: string;
  ogImagePath?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const canonical = buildCanonical(pathname);
  const image = toAbsoluteUrl(ogImagePath ?? DEFAULT_OG_IMAGE_PATH);
  const normalizedDescription = trimDescription(description);

  return {
    title,
    description: normalizedDescription,
    keywords,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description: normalizedDescription,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_CA",
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: normalizedDescription,
      images: [image],
    },
  };
}

function buildGameDescription(game: GameRow): string {
  const date = new Date(game.starts_at).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const venue = [game.venue_name, game.venue_area].filter(Boolean).join(", ");
  return trimDescription(
    `${game.title} in ${venue}. ${date}. ${game.skill_level} level with ${game.signed_count}/${game.capacity} spots filled.`
  );
}

export function buildGameMetadata(game: GameRow): Metadata {
  const pathname = `/games/${game.id}`;
  const canonical = buildCanonical(pathname);
  const ogImage = toAbsoluteUrl(`${pathname}/opengraph-image`);
  const description = buildGameDescription(game);
  const title = `${game.title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_CA",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function getSeoSiteConfig(): {
  siteName: string;
  description: string;
  baseUrl: URL;
  defaultOgImage: string;
} {
  return {
    siteName: SITE_NAME,
    description: SITE_DESCRIPTION,
    baseUrl: baseUrl(),
    defaultOgImage: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
  };
}
