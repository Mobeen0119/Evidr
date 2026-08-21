"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";

interface Row {
  caseId: string;
  caseTitle: string;
  id: string;
  title: string;
  kind: string;
  stance: string;
  quality: number;
  excerpt: string;
}

const stances = ["all", "supports", "contradicts", "neutral", "context"] as const;

export function EvidenceExplorer({ rows }: { rows: Row[] }) {
  const [stance, setStance] = useState<(typeof stances)[number]>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (stance === "all" || r.stance === stance) &&
          (!query || r.title.toLowerCase().includes(query.toLowerCase()) || r.excerpt.toLowerCase().includes(query.toLowerCase()))
      ),
    [rows, stance, query]
  );

  const contradicted = rows.filter((r) => r.stance === "contradicts").length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Evidence</h1>
          <p className="mt-2 text-case-muted">
            {rows.length} evidence nodes across all cases · <span className="text-case-red">{contradicted} contradicting</span> ·{" "}
            <span className="text-case-green">{rows.filter((r) => r.stance === "supports").length} supporting</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {stances.map((s) => (
          <button
            key={s}
            onClick={() => setStance(s)}
            className={`rounded-md px-3 py-1.5 text-xs transition ${stance === s ? "bg-case-cyan/15 text-case-cyan" : "text-case-muted hover:text-case-text"}`}
          >
            {s}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter evidence…"
          className="ml-auto min-w-0 flex-1 rounded-lg border border-case-border bg-black/30 px-3 py-1.5 text-sm outline-none focus:border-case-cyan sm:max-w-xs"
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((row) => (
          <Link key={row.id} href={`/cases/${row.caseId}`} className="group rounded-xl border border-case-border bg-case-panel/80 p-4 transition hover:border-case-cyan/60">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={row.stance === "supports" ? "green" : row.stance === "contradicts" ? "red" : "neutral"}>{row.stance}</Badge>
              <span className="font-mono text-xs text-case-muted">{row.kind}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-case-text">{row.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-case-muted">{row.excerpt}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-case-muted">
              <span className="truncate">{row.caseTitle}</span>
              <ArrowUpRight size={14} className="text-case-cyan opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="mt-2 h-1 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-case-cyan" style={{ width: `${row.quality}%` }} />
            </div>
          </Link>
        ))}
        {!filtered.length && <p className="text-sm text-case-muted">No evidence matches this filter.</p>}
      </div>
    </section>
  );
}
