import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BrowseClient } from "@/components/features/browse/BrowseClient";
import { SeoJsonLd } from "@/components/shared/SeoJsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo-schema";
import { getSignupsGroupedByGameId, listLiveGames } from "@/server/queries/games";

export async function BrowsePage() {
  const games = await listLiveGames();
  const signupsByGameId = await getSignupsGroupedByGameId(games.map((game) => game.id));
  const schemaData = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Browse", path: "/browse" },
  ]);

  return (
    <div>
      <SeoJsonLd data={schemaData} />
      <SiteHeader />
      <section style={{ borderBottom: "2px solid var(--ink)", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 18px 28px" }}>
          <div className="label" style={{ marginBottom: 10 }}>Browse · {games.length} results</div>
          <BrowseClient games={games} signupsByGameId={signupsByGameId} />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
