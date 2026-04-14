import { redirect } from "next/navigation";

export default async function AdminIndexPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(sp)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) qs.append(key, v);
    } else {
      qs.set(key, raw);
    }
  }
  const suffix = qs.toString();
  redirect(suffix ? `/admin/games?${suffix}` : "/admin/games");
}
