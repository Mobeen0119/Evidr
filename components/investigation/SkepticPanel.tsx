"use client";
import { motion } from "framer-motion";
import { ArrowRight, Scale, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { SkepticReport } from "@/types/investigation";

const kindLabel = { alternative: "Alternative explanation", conflict: "Conflicting source", assumption: "Weakened assumption" } as const;
const kindTone = { alternative: "text-case-cyan", conflict: "text-case-red", assumption: "text-case-amber" } as const;

export function SkepticPanel({ report, running }: { report?: SkepticReport; running?: boolean }) {
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-[.22em] text-case-muted">
        <Scale size={15} className={running ? "text-case-cyan" : "text-case-amber"} />
        Skeptic Check
      </h2>
      <p className="mb-4 text-sm leading-6 text-case-muted">
        The pipeline actively attempted to <span className="text-case-text">disprove its own conclusion</span> — searching for
        contradictory evidence, alternative explanations, and weak assumptions.
      </p>

      {report && (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-case-border bg-black/20 p-4">
            <span className="text-xs uppercase tracking-widest text-case-muted">Conclusion confidence</span>
            <span className="font-mono text-xl text-case-text">{report.confidenceBefore}</span>
            <ArrowRight size={16} className="text-case-amber" />
            <span className="font-mono text-xl text-case-amber">{report.confidenceAfter}</span>
            <span className="ml-auto rounded-full border border-case-amber/40 bg-case-amber/10 px-2.5 py-1 text-xs text-case-amber">
              adjusted −{report.confidenceBefore - report.confidenceAfter}
            </span>
          </div>

          <div className="space-y-2">
            {report.findings.map((finding, i) => (
              <motion.div
                key={`${finding.kind}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.12 }}
                className="flex items-start gap-3 rounded-lg border border-case-border bg-black/20 px-3 py-2.5 text-sm"
              >
                <ShieldAlert size={15} className={`mt-0.5 ${kindTone[finding.kind]}`} />
                <div className="min-w-0">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${kindTone[finding.kind]}`}>{kindLabel[finding.kind]}</span>
                  <p className="mt-0.5 text-case-text">{finding.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-case-muted">{finding.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-4 border-t border-case-border pt-3 text-xs leading-5 text-case-muted">{report.note}</p>
        </>
      )}

      {!report && !running && <p className="text-sm text-case-muted">No counter-evidence phase ran for this case.</p>}
    </Card>
  );
}
