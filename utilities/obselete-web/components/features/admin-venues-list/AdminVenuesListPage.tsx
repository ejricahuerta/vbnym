import { AdminVenueCard } from "@/components/admin/admin-venue-card";
import { CreateVenueModal } from "@/components/admin/create-venue-modal";
import { Card, CardContent } from "@/components/ui/card";
import { getVenues } from "@/server/queries/venues";
import type { Venue } from "@/types/vbnym";

export async function AdminVenuesListPage() {
  const { venues, error } = await getVenues();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Venues</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reusable gyms and courts. When you create a game, pick a saved venue to
            fill location and address.
          </p>
        </div>
        <CreateVenueModal variant="default" />
      </div>
      {error ? (
        <Card
          size="sm"
          className="border-destructive/30 bg-destructive/10 py-3 text-destructive shadow-none"
        >
          <CardContent className="px-3 py-0 text-sm">{error}</CardContent>
        </Card>
      ) : null}
      {!error && venues.length === 0 ? (
        <Card size="sm" className="border-dashed py-6 text-center shadow-none">
          <CardContent className="py-0 text-sm text-muted-foreground">
            No venues yet. Add one to speed up scheduling.
          </CardContent>
        </Card>
      ) : null}
      {!error && venues.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {venues.map((v: Venue) => (
            <AdminVenueCard key={v.id} venue={v} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
