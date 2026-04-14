import { redirect } from "next/navigation";

/** Legacy player magic-link URL; player login was removed. */
export default function LoginPageRedirect() {
  redirect("/");
}
