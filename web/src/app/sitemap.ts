import type { MetadataRoute } from "next";

import { includeGameInPublicLiveList } from "@/lib/dropin-session";
import { buildCanonical } from "@/lib/seo";
import { listLiveGames } from "@/server/queries/games";

const STATIC_PUBLIC_ROUTES = ["/", "/browse", "/privacy", "/terms", "/player-policies"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nowMs = Date.now();
  const games = (await listLiveGames()).filter((game) => includeGameInPublicLiveList(game, nowMs));
  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: buildCanonical(route),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const gameEntries: MetadataRoute.Sitemap = games.map((game) => ({
    url: buildCanonical(`/games/${game.id}`),
    lastModified: game.created_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...gameEntries];
}
