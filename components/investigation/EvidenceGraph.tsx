"use client";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Claim, Evidence, EvidenceRelationship } from "@/types/investigation";

function statusColor(status?: string) {
  if (status === "supported" || status === "supports") return { text: "text-case-green", border: "border-case-green/40", bg: "bg-case-green/10" };
  if (status === "contradicted" || status === "contradicts" || status === "disputes") return { text: "text-case-red", border: "border-case-red/40", bg: "bg-case-red/10" };
  if (status === "exaggerated" || status === "uncertain") return { text: "text-case-amber", border: "border-case-amber/40", bg: "bg-case-amber/10" };
  return { text: "text-case-muted", border: "border-case-border", bg: "bg-white/5" };
}

function kindIcon(kind: string) {
  const k = kind.toLowerCase();
  if (k.includes("study") || k.includes("report")) return "📄";
  if (k.includes("article") || k.includes("news")) return "📰";
  if (k.includes("message") || k.includes("post")) return "💬";
  return "🔗";
}

type Filter = "all" | "contradictions" | "supported" | "uncertain";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "supported", label: "Holds up" },
  { key: "contradictions", label: "Doesn't add up" },
  { key: "uncertain", label: "Not sure yet" }
];

interface Props {
  claims: Claim[];
  evidence: Evidence[];
  relationships: EvidenceRelationship[];
  onSelectClaim?: (claim: Claim) => void;
}

export function EvidenceGraph({ claims, evidence, onSelectClaim }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  const filteredClaims = useMemo(() => {
    if (filter === "all") return claims;
    return claims.filter((c) => {
      if (filter === "contradictions") return c.status === "contradicted" || c.status === "exaggerated";
      if (filter === "supported") return c.status === "supported";
      return c.status === "uncertain";
    });
  }, [claims, filter]);

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-2 border-b border-case-border px-3 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs uppercase tracking-[.18em] text-case-muted sm:text-sm sm:tracking-[.22em]">How we got here</h2>
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition ${filter === f.key ? "bg-case-cyan/15 text-case-cyan" : "text-case-muted hover:text-case-text"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="pb-1 text-xs text-case-muted">
          Green means it supports, red means it contradicts, amber means we're not sure yet.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-3 sm:p-6">
        <div className="flex-1">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-case-muted">What we checked</p>
          <div className="space-y-2">
            {filteredClaims.map((claim) => {
              const c = statusColor(claim.status);
              return (
                <button
                  key={claim.id}
                  onClick={() => onSelectClaim?.(claim)}
                  className={`block w-full rounded-lg border ${c.border} ${c.bg} p-3 text-left text-sm transition hover:brightness-110`}
                >
                  <span className={`mb-1 block font-mono text-[10px] uppercase tracking-wide ${c.text}`}>{claim.status}</span>
                  <span className="text-case-text">{claim.text.slice(0, 90)}{claim.text.length > 90 ? "…" : ""}</span>
                </button>
              );
            })}
            {!filteredClaims.length && <p className="text-sm text-case-muted">Nothing matches this filter.</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center py-2 sm:py-8">
          <ArrowRight size={20} className="hidden text-case-muted sm:block" />
          <ArrowDown size={20} className="text-case-muted sm:hidden" />
        </div>

        <div className="flex-1">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-case-muted">What we found</p>
          <div className="space-y-2">
            {evidence.map((item) => {
              const c = statusColor(item.stance);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedEvidence(item)}
                  className={`block w-full rounded-lg border ${c.border} ${c.bg} p-3 text-left text-sm transition hover:brightness-110`}
                >
                  <span className="mb-1 block text-case-text">{kindIcon(item.kind)} {item.title}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wide ${c.text}`}>{item.stance}</span>
                </button>
              );
            })}
            {!evidence.length && <p className="text-sm text-case-muted">No separate evidence pieces for this case.</p>}
          </div>
        </div>
      </div>

      {selectedEvidence && (
        <div className="border-t border-case-border p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[.18em] text-case-cyan">{selectedEvidence.kind}</span>
            <button onClick={() => setSelectedEvidence(null)} className="text-case-muted hover:text-case-text">
              ×
            </button>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-case-text">{selectedEvidence.title}</h3>
          <p className="mt-2 text-xs leading-5 text-case-muted">{selectedEvidence.excerpt}</p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-case-muted">
            <span>Quality {selectedEvidence.quality}%</span>
            <span className="capitalize">{selectedEvidence.stance}</span>
          </div>
          {selectedEvidence.url && (
            <a href={selectedEvidence.url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-case-cyan hover:underline">
              {selectedEvidence.url}
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
