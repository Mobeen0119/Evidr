"use client";
import { motion } from "framer-motion";
import { ScanSearch } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { SyntheticReport, SyntheticSignal } from "@/types/investigation";

const statusTone = { detected: "red", moderate: "amber", low: "green", unknown: "neutral" } as const;
const statusDot = { detected: "bg-case-red", moderate: "bg-case-amber", low: "bg-case-green", unknown: "bg-case-muted" } as const;

function SignalRow({ signal, delay }: { signal: SyntheticSignal; delay: number }) {
  const tone = statusTone[signal.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 rounded-lg border border-case-border bg-black/20 px-3 py-2.5"
    >
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusDot[signal.status]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-case-text">{signal.label}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone === "red" ? "border-case-red/40 text-case-red bg-case-red/10" : "border-case-amber/40 text-case-amber bg-case-amber/10"}`}>
            {signal.status.toUpperCase()}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-case-muted">{signal.detail}</p>
      </div>
    </motion.div>
  );
}

export function SyntheticSignals({ report }: { report?: SyntheticReport }) {
  const notable = report?.signals.filter((s) => s.status === "detected" || s.status === "moderate") ?? [];

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-[.22em] text-case-muted">
        <ScanSearch size={15} className="text-case-cyan" />
        Writing-style check
      </h2>
      {report ? (
        <>
          <p className="text-sm leading-6 text-case-text">
            Score: <span className="font-semibold text-case-amber">{report.overallScore}/100</span> — {report.label}.
          </p>
          <p className="mt-1.5 text-xs leading-5 text-case-muted">
            This is a rough style guess, not proof. It cannot prove whether something was written by AI, and it says nothing about whether the content is true.
          </p>
          {notable.length > 0 && (
            <div className="mt-3 space-y-2">
              {notable.map((signal, i) => (
                <SignalRow key={signal.key} signal={signal} delay={i * 0.08} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-case-muted">No writing-style scan was performed for this case.</p>
      )}
    </Card>
  );
}
