import { redirect } from "next/navigation";

export async function PlayerLoginRedirectPage(): Promise<never> {
  redirect("/");
}
