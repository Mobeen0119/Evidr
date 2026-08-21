import Link from "next/link";
import { FileText } from "lucide-react";
import { listCases } from "@/lib/database/repository";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { Badge } from "@/components/ui/Card";
import { plainVerdictLabel } from "@/lib/investigation/verdict";

export default async function ReportsPage() {
  const session = await requireUserPage();
  const cases = await listCases(session.userId);
  const reports = cases.flatMap((c) =>
    (c.reports.length ? c.reports : [{ id: `report-${c.id}`, caseId: c.id, title: `${c.title} — report`, createdAt: c.updatedAt }]).map((r) => ({
      id: r.id,
      caseId: c.id,
      title: r.title,
      createdAt: r.createdAt,
      verdict: c.verdict,
      confidence: c.confidence
    }))
  );

  return (
    <Shell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your reports</h1>
        <p className="mt-2 text-case-muted">A clean, downloadable summary for each case you've checked.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.caseId}`} className="group rounded-xl border border-case-border bg-case-panel/80 p-5 transition hover:-translate-y-0.5 hover:border-case-cyan/60">
              <FileText size={20} className="text-case-cyan" />
              <h3 className="mt-3 text-sm font-semibold leading-6 text-case-text">{report.title}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-case-muted">
                <Badge tone={plainVerdictLabel(report.verdict).tone}>{plainVerdictLabel(report.verdict).headline}</Badge>
                <span>{report.confidence}%</span>
              </div>
              <p className="mt-2 text-xs text-case-muted">{new Date(report.createdAt).toLocaleString()}</p>
            </Link>
          ))}
          {!reports.length && <p className="text-sm text-case-muted">No reports yet.</p>}
        </div>
      </section>
    </Shell>
  );
}
