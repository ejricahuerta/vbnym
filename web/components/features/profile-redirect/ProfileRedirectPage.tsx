import { redirect } from "next/navigation";

export async function ProfileRedirectPage(): Promise<never> {
  redirect("/app/my-games");
}
