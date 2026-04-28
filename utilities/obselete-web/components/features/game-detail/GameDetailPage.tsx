import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { GameDetailClient } from "@/components/games/game-detail-client";
import { PLAYER_RECOVER_SESSION_COOKIE } from "@/lib/player-recover-cookie";
import { verifyPlayerRecoverSessionToken } from "@/lib/player-magic-link";
import { getGameWithSignups } from "@/server/queries/games";

export async function GameDetailPage({ id }: { id: string }) {
  const data = await getGameWithSignups(id);
  if (!data) notFound();
  const cookieStore = await cookies();
  const session = verifyPlayerRecoverSessionToken(
    cookieStore.get(PLAYER_RECOVER_SESSION_COOKIE)?.value
  );

  return (
    <GameDetailClient
      game={data.game}
      signups={data.signups}
      authenticatedEmail={session?.email ?? null}
    />
  );
}
