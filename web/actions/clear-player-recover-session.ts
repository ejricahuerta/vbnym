"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { PLAYER_RECOVER_SESSION_COOKIE } from "@/lib/player-recover-cookie";

export async function clearPlayerRecoverSession(): Promise<void> {
  const store = await cookies();
  store.delete(PLAYER_RECOVER_SESSION_COOKIE);
  revalidatePath("/app/my-games");
}
