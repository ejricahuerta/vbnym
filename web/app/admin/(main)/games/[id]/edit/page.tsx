import Link from "next/link";
import { notFound } from "next/navigation";
import { EditGameForm } from "@/components/admin/edit-game-form";
import { Button } from "@/components/ui/button";
import { getGameById } from "@/lib/data/games";
import { getVenues } from "@/lib/data/venues";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();
  const { venues } = await getVenues();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let adminAlreadySignedUp = false;
  const adminEmail = user?.email?.trim().toLowerCase();
  if (adminEmail) {
    const { data: selfRows } = await supabase
      .from("signups")
      .select("id")
      .eq("game_id", id)
      .eq("email", adminEmail)
      .limit(1);
    adminAlreadySignedUp = Boolean(selfRows?.length);
  }

  return (
    <div className="space-y-6">
      <p className="mb-2 text-sm text-muted-foreground">
        <Button
          variant="link"
          size="sm"
          asChild
          className="h-auto p-0 text-muted-foreground"
        >
          <Link href="/admin/games">Games</Link>
        </Button>
        <span aria-hidden> / </span>
        <span>Edit</span>
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Edit game</h1>
      <p className="text-sm text-muted-foreground">
        Update details, listing visibility, or optional how-to-enter notes for
        players.
      </p>
      <EditGameForm
        game={game}
        venues={venues}
        adminAlreadySignedUp={adminAlreadySignedUp}
      />
    </div>
  );
}
