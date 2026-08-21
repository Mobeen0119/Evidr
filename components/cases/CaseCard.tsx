import Link from "next/link";
import { Badge } from "@/components/ui/Card";
import type { TruthCase } from "@/types/investigation";

export function CaseCard({ item }: { item: TruthCase }) {
  const contradicted = item.claims.filter((c) => c.status === "contradicted" || c.status === "exaggerated").length;
  return (
    <Link href={`/cases/${item.id}`} className="block rounded-2xl border border-case-border bg-case-panel/80 p-5 transition hover:-translate-y-0.5 hover:border-case-cyan/60">
      <div className="mb-3 flex items-center justify-between gap-3"><Badge tone={item.mode === "demo" ? "amber" : "cyan"}>{item.mode.toUpperCase()}</Badge><span className="text-xs text-case-muted">{new Date(item.updatedAt).toLocaleDateString()}</span></div>
      <h3 className="font-semibold text-case-text">{item.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-case-muted">{item.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-case-muted"><span>{item.claims.length} claims</span><span>·</span><span>{item.evidence.length} sources/evidence</span><span>·</span><span>{contradicted} contradictions</span></div>
    </Link>
  );
}
