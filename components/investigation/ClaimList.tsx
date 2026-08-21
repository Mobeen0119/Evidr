"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import type { Claim } from "@/types/investigation";

const icon = { supported: CheckCircle2, uncertain: CircleHelp, contradicted: XCircle, exaggerated: AlertTriangle };
const tone = { supported: "green", uncertain: "amber", contradicted: "red", exaggerated: "amber" } as const;
const color = { supported: "text-case-green", uncertain: "text-case-amber", contradicted: "text-case-red", exaggerated: "text-case-amber" } as const;

type Filter = "all" | Claim["status"];

export function ClaimList({ claims, selectedId, onSelect }: { claims: Claim[]; selectedId?: string; onSelect?: (claim: Claim) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = claims.filter((c) => filter === "all" || c.status === filter);

  return (
    <Card className="h-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-sm uppercase tracking-[.22em] text-case-muted">Claims</h2>
        <div className="flex items-center gap-1.5">
          {(["all", "supported", "uncertain", "contradicted", "exaggerated"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs transition ${filter === f ? "bg-case-cyan/15 text-case-cyan" : "text-case-muted hover:text-case-text"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {claims.length > 0 && (
          <SummaryPill status="supported" count={claims.filter((c) => c.status === "supported").length} />
        )}
        <SummaryPill status="uncertain" count={claims.filter((c) => c.status === "uncertain").length} />
        <SummaryPill status="contradicted" count={claims.filter((c) => c.status === "contradicted").length} />
        <SummaryPill status="exaggerated" count={claims.filter((c) => c.status === "exaggerated").length} />
      </div>

      <div className="space-y-3">
        {visible.map((claim) => {
          const Icon = icon[claim.status];
          const isOpen = selectedId === claim.id;
          return (
            <button
              key={claim.id}
              onClick={() => onSelect?.(claim)}
              className={`w-full rounded-xl border bg-black/20 p-4 text-left transition ${isOpen ? "border-case-cyan/60" : "border-case-border hover:border-case-cyan/50"}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 ${color[claim.status]}`} size={18} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone[claim.status]}>{claim.status}</Badge>
                    <span className="font-mono text-xs text-case-muted">conf {claim.confidence}%</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-case-text">{claim.text}</p>
                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t border-case-border pt-3 text-xs leading-5 text-case-muted">
                      <p>
                        <span className="text-case-text">What this means:</span> {claim.verdict}
                      </p>
                      {claim.primarySource && (
                        <p>
                          <span className="text-case-text">What we found:</span> {claim.primarySource}
                        </p>
                      )}
                      {claim.independentSources.length > 0 && (
                        <p>
                          <span className="text-case-text">Independent:</span> {claim.independentSources.join(" · ")}
                        </p>
                      )}
                      <p>
                        <span className="text-case-text">Receipts:</span> {claim.receipts.length} evidence receipt{claim.receipts.length === 1 ? "" : "s"} on this claim
                      </p>
                      {claim.receipts.length > 0 && (
                        <ul className="space-y-1.5 pl-1">
                          {claim.receipts.map((r) => (
                            <li key={r.id} className="flex items-start gap-2">
                              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${r.strength === "high" ? "bg-case-green" : r.strength === "medium" ? "bg-case-amber" : "bg-case-muted"}`} />
                              <span>
                                <span className="text-case-text">{r.label}:</span> {r.detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {claim.citations && claim.citations.length > 0 && (
                        <div className="mt-2 border-t border-case-border pt-2">
                          <p className="mb-1.5 text-case-text">Live web citations:</p>
                          <ul className="space-y-1.5">
                            {claim.citations.map((c, i) => (
                              <li key={i}>
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-case-cyan hover:underline"
                                >
                                  {c.title}
                                </a>
                                <span className="text-case-muted"> — {c.note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {!visible.length && <p className="py-6 text-center text-sm text-case-muted">No claims match this filter.</p>}
      </div>
    </Card>
  );
}

function SummaryPill({ status, count }: { status: Claim["status"]; count: number }) {
  const label: Record<Claim["status"], string> = { supported: "✓ supported", uncertain: "? uncertain", contradicted: "✕ contradicted", exaggerated: "⚠ exaggerated" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${count ? "border-case-border text-case-text" : "border-case-border/50 text-case-muted/60"}`}>
      <span className={count ? color[status] : "text-case-muted/60"}>{label[status]}</span>
      <span className="text-case-muted">{count}</span>
    </span>
  );
}
