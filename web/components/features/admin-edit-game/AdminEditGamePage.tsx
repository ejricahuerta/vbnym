import Link from "next/link";
import { notFound } from "next/navigation";

import { EditGameForm } from "@/components/admin/edit-game-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAdminHasSignupForGame } from "@/server/queries/admin-game-edit";
import { getGameById } from "@/server/queries/games";
import { getVenues } from "@/server/queries/venues";

export async function AdminEditGamePage({ id }: { id: string }) {
  const game = await getGameById(id);
  if (!game) notFound();
  const { venues } = await getVenues();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = user?.email?.trim().toLowerCase() ?? null;
  const adminAlreadySignedUp = await getAdminHasSignupForGame(id, adminEmail);

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
