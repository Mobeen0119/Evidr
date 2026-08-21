import { listCases } from "@/lib/database/repository";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { InvestigationFlow } from "@/components/investigation/InvestigationFlow";
import { CaseCard } from "@/components/cases/CaseCard";
import { Card, Badge } from "@/components/ui/Card";
import { ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireUserPage();
  const cases = await listCases(session.userId);
  const watches = cases.flatMap((c) =>
    c.watches.filter((w) => w.status === "active").map((w) => ({ caseId: c.id, title: c.title, target: w.target }))
  );
  const findings = cases
    .flatMap((c) =>
      c.claims
        .filter((cl) => cl.status === "contradicted" || cl.status === "exaggerated")
        .map((cl) => ({ caseId: c.id, caseTitle: c.title, text: cl.text, status: cl.status }))
    )
    .slice(0, 4);

  return (
    <Shell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="stamp text-case-amber">File status: open</p>
        <h1 className="mt-3 font-heading text-4xl uppercase tracking-[.02em]">What are we investigating?</h1>

        <div className="mt-6">
          <InvestigationFlow />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h2 className="mb-4 font-mono text-sm uppercase tracking-[.22em] text-case-muted">Active Cases</h2>
            <div className="animate-stagger grid gap-4 md:grid-cols-2">
              {cases.slice(0, 4).map((item) => (
                <CaseCard key={item.id} item={item} />
              ))}
              {!cases.length && <p className="text-sm text-case-muted">No cases yet. Start your first investigation above.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 font-mono text-sm uppercase tracking-[.22em] text-case-muted">Recent Findings</h2>
              {findings.length ? (
                <ul className="space-y-3">
                  {findings.map((f, i) => (
                    <li key={i} className="border border-case-border bg-black/25 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={f.status === "exaggerated" ? "amber" : "red"}>{f.status}</Badge>
                        <span className="truncate text-xs text-case-muted">{f.caseTitle}</span>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-case-text">"{f.text.slice(0, 90)}{f.text.length > 90 ? "…" : ""}"</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-case-muted">No contradicted or exaggerated claims recorded yet.</p>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 font-mono text-sm uppercase tracking-[.22em] text-case-muted">Watchlist</h2>
              {watches.length ? (
                <ul className="space-y-2">
                  {watches.slice(0, 4).map((w, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-case-text">{w.target}</span>
                      <a href={`/cases/${w.caseId}`} className="text-case-amber hover:underline">
                        <ArrowUpRight size={14} />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-case-muted">Open a case and add a watch to monitor sources for new evidence.</p>
              )}
            </Card>
          </div>
        </div>
      </section>
    </Shell>
  );
}
