import Link from "next/link";
import { deleteVenue } from "@/server/actions/admin-venues";
import { DeleteResourceDialog } from "@/components/admin/delete-resource-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { venueImageOrPlaceholder } from "@/lib/venue-placeholder-image";
import type { Venue } from "@/types/vbnym";

type Props = {
  venue: Venue;
  /** Tighter layout for the games page sidebar. */
  compact?: boolean;
};

export function AdminVenueCard({ venue, compact }: Props) {
  const src = venueImageOrPlaceholder(venue.image_url, venue.id);
  const coords =
    venue.lat != null && venue.lng != null
      ? ` · ${venue.lat.toFixed(4)}, ${venue.lng.toFixed(4)}`
      : "";

  return (
    <Card
      size={compact ? "sm" : "default"}
      className="gap-0 overflow-hidden py-0 shadow-sm ring-border/40"
    >
      <img
        alt=""
        src={src}
        className={
          compact
            ? "aspect-[5/3] w-full object-cover"
            : "aspect-video w-full object-cover"
        }
      />
      <CardHeader className="gap-1 pb-0 pt-4">
        <CardTitle className="line-clamp-2 leading-snug">
          {venue.name}
          {venue.is_featured ? (
            <span className="ms-2 align-middle text-xs font-semibold normal-case text-primary">
              · Home featured
            </span>
          ) : null}
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {venue.address ?? "No address"}
          {!compact ? coords : null}
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-2 flex flex-wrap gap-2 border-t border-border/60 pb-4 pt-4">
        <Button variant="outline" size="sm" className={compact ? "h-8 text-xs" : ""} asChild>
          <Link href={`/admin/venues/${venue.id}/edit`}>Edit</Link>
        </Button>
        <DeleteResourceDialog
          action={deleteVenue}
          hiddenFields={{ id: venue.id }}
          resourceLabel="venue"
          resourceTitle={venue.name}
          triggerClassName={compact ? "h-8 text-xs" : undefined}
        />
      </CardFooter>
    </Card>
  );
}
