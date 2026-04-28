import { redirect } from "next/navigation";

/** Legacy player magic-link URL; player login was removed. */
export async function LegacyLoginRedirectPage(): Promise<never> {
  redirect("/");
}
