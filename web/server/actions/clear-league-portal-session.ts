'use server';

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LEAGUE_PORTAL_SESSION_COOKIE } from "@/lib/league-portal-cookie";

export async function clearLeaguePortalSession(): Promise<void> {
  const store = await cookies();
  store.delete(LEAGUE_PORTAL_SESSION_COOKIE);
  revalidatePath("/app/league-team");
}
