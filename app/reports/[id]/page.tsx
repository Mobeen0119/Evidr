import { notFound } from "next/navigation";
import { getCase } from "@/lib/database/repository";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { ReportView } from "@/components/reports/ReportView";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { generateReport } from "@/lib/reports/generator";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUserPage();
  const item = await getCase(id, session.userId);
  if (!item) notFound();
  const report = item.reports[0] ?? generateReport(item);
  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.22em] text-case-muted">Report · {new Date(item.updatedAt).toLocaleDateString()}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{report.title}</h1>
          </div>
          <ReportToolbar markdown={report.markdown} title={report.title} />
        </div>
        <div className="print:px-0">
          <ReportView markdown={report.markdown} />
        </div>
      </section>
    </Shell>
  );
}
