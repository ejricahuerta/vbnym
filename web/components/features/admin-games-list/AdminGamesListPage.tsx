import { deleteGame } from "@/server/actions/admin-games";
import { listGamesForAdmin } from "@/server/queries/games";
import { getVenues } from "@/server/queries/venues";
import { CreateGameModal } from "@/components/admin/create-game-modal";
import { CreateVenueModal } from "@/components/admin/create-venue-modal";
import { Card, CardContent } from "@/components/ui/card";
import { AdminGamesListInteractive } from "@/components/features/admin-games-list/AdminGamesListInteractive";
import { venueImageOrPlaceholder } from "@/lib/venue-placeholder-image";

export async function AdminGamesListPage() {
  // eslint-disable-next-line react-hooks/purity -- async RSC: one clock snapshot per request for schedule buckets.
  const referenceTimeMs = Date.now();
  const [{ venues }, { games, error: err }] = await Promise.all([
    getVenues(),
    listGamesForAdmin(),
  ]);

  const venueImageById = new Map(
    venues.map((v) => [v.id, v.image_url ?? null] as const)
  );

  const gameImageSrcById = Object.fromEntries(
    games.map((g) => [
      g.id,
      venueImageOrPlaceholder(
        g.venue_id ? (venueImageById.get(g.venue_id) ?? null) : null,
        g.venue_id ?? g.id
      ),
    ])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Games</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit or delete scheduled games. Public home shows upcoming public games.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <CreateVenueModal />
          <CreateGameModal venues={venues} />
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        {err ? (
          <Card size="sm" className="border-destructive/30 bg-destructive/10 py-3 text-destructive shadow-none">
            <CardContent className="px-3 py-0 text-sm">{err}</CardContent>
          </Card>
        ) : null}
        {!err && games.length === 0 ? (
          <Card size="sm" className="border-dashed py-6 text-center shadow-none">
            <CardContent className="py-0 text-sm text-muted-foreground">No games yet.</CardContent>
          </Card>
        ) : null}
        {!err && games.length > 0 ? (
          <AdminGamesListInteractive
            games={games}
            gameImageSrcById={gameImageSrcById}
            deleteGameAction={deleteGame}
            referenceTimeMs={referenceTimeMs}
          />
        ) : null}
      </div>
    </div>
  );
}
