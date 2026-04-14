import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { GameDetailClient } from "@/components/games/game-detail-client";
import { getGameWithSignups } from "@/lib/data/games";
import { verifyPlayerRecoverSessionToken } from "@/lib/player-magic-link";
import { PLAYER_RECOVER_SESSION_COOKIE } from "@/lib/player-recover-cookie";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
