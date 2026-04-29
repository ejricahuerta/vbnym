import type { GameRow } from "@/types/domain";

import { buildCanonical, getSeoSiteConfig } from "@/lib/seo";

type JsonLdRecord = Record<string, unknown>;

function asDatePublished(date: string): string {
  return new Date(date).toISOString();
}

export function buildOrganizationSchema(): JsonLdRecord {
  const site = getSeoSiteConfig();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.siteName,
    url: site.baseUrl.toString(),
    logo: site.defaultOgImage,
    sameAs: [],
  };
}

export function buildWebsiteSchema(): JsonLdRecord {
  const site = getSeoSiteConfig();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteName,
    url: site.baseUrl.toString(),
    inLanguage: "en-CA",
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.baseUrl.toString()}browse`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonical(item.path),
    })),
  };
}

export function buildLegalWebPageSchema({
  title,
  description,
  path,
  effectiveDate,
}: {
  title: string;
  description: string;
  path: string;
  effectiveDate: string;
}): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: buildCanonical(path),
    datePublished: asDatePublished(effectiveDate),
    dateModified: asDatePublished(effectiveDate),
    isPartOf: {
      "@type": "WebSite",
      name: getSeoSiteConfig().siteName,
      url: getSeoSiteConfig().baseUrl.toString(),
    },
  };
}

export function buildGameEventSchema(game: GameRow): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: game.title,
    startDate: asDatePublished(game.starts_at),
    endDate: asDatePublished(new Date(new Date(game.starts_at).getTime() + game.duration_minutes * 60_000).toISOString()),
    description: game.notes?.trim() || `${game.skill_level} volleyball session hosted by ${game.host_name}.`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: game.venue_name,
      address: {
        "@type": "PostalAddress",
        addressLocality: game.venue_area || "Toronto",
        addressRegion: "ON",
        addressCountry: "CA",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "6ix Back Volleyball",
      email: game.host_email,
    },
    offers: {
      "@type": "Offer",
      price: Number((game.price_cents / 100).toFixed(2)),
      priceCurrency: "CAD",
      availability:
        game.signed_count >= game.capacity ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: buildCanonical(`/games/${game.id}`),
      validFrom: asDatePublished(game.created_at),
    },
  };
}
