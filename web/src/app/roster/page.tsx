import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Roster",
  description: "Roster utilities for host operations.",
  pathname: "/roster",
  noIndex: true,
});

export default function Page() {
  redirect("/host");
}
