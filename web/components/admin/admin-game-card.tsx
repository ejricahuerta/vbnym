import Link from "next/link";
import { deleteGame } from "@/actions/admin-games";
import { DeleteResourceDialog } from "@/components/admin/delete-resource-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Game } from "@/types/vbnym";
import { formatGameCourtLine, formatGameTimeRangeLabel } from "@/lib/game-display";

type Props = {
  game: Game;
  imageSrc: string;
};

export function AdminGameCard({ game, imageSrc }: Props) {
  const court = formatGameCourtLine(game.court);
  const meta = `${game.date} · ${formatGameTimeRangeLabel(game)} · cap ${game.cap} · $${Number(game.price).toFixed(2)}`;
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm ring-border/40">
      <img alt="" src={imageSrc} className="aspect-video w-full object-cover" />
      <CardHeader className="gap-1 pb-0 pt-4">
        <CardTitle className="line-clamp-2 leading-snug">{game.location}</CardTitle>
        <CardDescription>{court ? `${court} · ${meta}` : meta}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-2 flex flex-wrap gap-2 border-t border-border/60 pb-4 pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/games/${game.id}/edit`}>Edit</Link>
        </Button>
        <DeleteResourceDialog
          action={deleteGame}
          hiddenFields={{ id: game.id }}
          resourceLabel="game"
          resourceTitle={game.location}
        />
      </CardFooter>
    </Card>
  );
}
