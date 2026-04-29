import type { MetadataRoute } from "next";

import { getSeoSiteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = getSeoSiteConfig();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/games/", "/privacy", "/terms", "/player-policies"],
        disallow: ["/admin", "/admin/login", "/host", "/host/new", "/host/request", "/host/login", "/login", "/player", "/roster", "/api/"],
      },
    ],
    sitemap: `${site.baseUrl.toString()}sitemap.xml`,
    host: site.baseUrl.toString(),
  };
}
