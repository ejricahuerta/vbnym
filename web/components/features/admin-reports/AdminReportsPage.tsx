import Link from "next/link";

import { SixBackSection } from "@/components/shared/SixBackPageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminReportsFeed } from "@/server/queries/admin-reports";

export async function AdminReportsPage() {
  const reports = await getAdminReportsFeed();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">Operational issue feed based on current payment and capacity data sources.</p>
      </div>

      <SixBackSection eyebrow="Admin" title="Issue feed" className="mt-0">
        {reports.length === 0 ? (
          <Card size="sm" className="border-dashed py-6 text-center shadow-none">
            <CardContent className="py-0 text-sm text-muted-foreground">No report items right now.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} size="sm" className="py-4">
                <CardContent className="space-y-2 px-4 py-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="uppercase tracking-[0.1em]">
                      {report.category}
                    </Badge>
                    <Badge
                      variant={report.severity === "high" ? "destructive" : "outline"}
                      className="uppercase tracking-[0.1em]"
                    >
                      {report.severity}
                    </Badge>
                    {report.createdAt ? (
                      <span className="text-xs text-muted-foreground">{report.createdAt.slice(0, 10)}</span>
                    ) : null}
                  </div>
                  <p className="font-semibold">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.detail}</p>
                  {report.gameId ? (
                    <Link href={`/admin/games/${report.gameId}/edit`} className="text-xs font-semibold uppercase tracking-[0.08em] underline">
                      Open game {report.gameLabel ? `- ${report.gameLabel}` : ""}
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SixBackSection>
    </div>
  );
}
