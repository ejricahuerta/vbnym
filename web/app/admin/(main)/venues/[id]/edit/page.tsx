import Link from "next/link";
import { notFound } from "next/navigation";
import { EditVenueForm } from "@/components/admin/edit-venue-form";
import { Button } from "@/components/ui/button";
import { getVenueById } from "@/lib/data/venues";

export default async function AdminEditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  return (
    <div className="space-y-6">
      <p className="mb-2 text-sm text-muted-foreground">
        <Button
          variant="link"
          size="sm"
          asChild
          className="h-auto p-0 text-muted-foreground"
        >
          <Link href="/admin/venues">Venues</Link>
        </Button>
        <span aria-hidden> / </span>
        <span>Edit</span>
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Edit venue</h1>
      <p className="text-sm text-muted-foreground">
        Update the display name, address, or map coordinates. Games that already used
        this venue keep their own copied location until you edit each run.
      </p>
      <EditVenueForm venue={venue} />
    </div>
  );
}
