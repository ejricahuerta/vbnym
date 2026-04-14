import { createClient } from "@/lib/supabase/server";
import type { Game, Signup } from "@/types/vbnym";
import { AdminSignupsTable } from "@/components/admin/admin-signups-table";
import { PolicyBroadcastPanel } from "@/components/admin/policy-broadcast-panel";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminSignupsPage() {
  let list: Signup[] = [];
  let err: string | null = null;
  const gameById: Record<string, Pick<Game, "id" | "location" | "date" | "court">> = {};

  try {
    const supabase = await createClient();
    const { data: signups, error: sErr } = await supabase
      .from("signups")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: games, error: rErr } = await supabase
      .from("games")
      .select("id, location, date, court");

    err = sErr?.message ?? rErr?.message ?? null;
    list = (signups ?? []) as Signup[];
    for (const r of (games ?? []) as Pick<Game, "id" | "location" | "date" | "court">[]) {
      gameById[r.id] = r;
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load signups.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Signups</h1>
        <p className="mt-2 hidden text-sm text-muted-foreground md:block">
          Mark players paid after e-transfer. Payment codes are generated at
          signup.
        </p>
      </div>
      <PolicyBroadcastPanel />
      {err ? (
        <Card size="sm" className="border-destructive/30 bg-destructive/10 py-3 text-destructive shadow-none">
          <CardContent className="px-3 py-0 text-sm">{err}</CardContent>
        </Card>
      ) : null}
      {!err && list.length === 0 ? (
        <Card size="sm" className="border-dashed py-6 text-center shadow-none">
          <CardContent className="py-0 text-sm text-muted-foreground">
            No signups yet.
          </CardContent>
        </Card>
      ) : null}
      {!err && list.length > 0 ? (
        <AdminSignupsTable signups={list} gameById={gameById} />
      ) : null}
    </div>
  );
}
