"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { InvestigationStep } from "@/types/investigation";

interface Props {
  steps: InvestigationStep[];
  running?: boolean;
  counts?: { claims: number; evidence: number; contradictions: number };
  skeptic?: { confidenceBefore: number; confidenceAfter: number };
}

function StatusIcon({ status }: { status: InvestigationStep["status"] }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 size={16} className="text-case-green" />;
    case "active":
      return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}><Loader2 size={16} className="text-case-cyan" /></motion.div>;
    case "warning":
      return <AlertTriangle size={16} className="text-case-amber" />;
    case "error":
      return <XCircle size={16} className="text-case-red" />;
    default:
      return <Circle size={16} className="text-case-muted/60" />;
  }
}

export function AgentActivity({ steps, running }: Props) {
  const doneCount = steps.filter((s) => s.status === "complete" || s.status === "warning" || s.status === "error").length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-sm uppercase tracking-[.22em] text-case-muted">
          {running ? "Checking..." : "Done"}
        </h2>
        <span className="font-mono text-xs text-case-muted">{progress}%</span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-case-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${step.status === "active" ? "border-case-cyan/40 bg-case-cyan/5" : "border-case-border bg-black/20"}`}
          >
            <span className="mt-0.5"><StatusIcon status={step.status} /></span>
            <span className="flex-1">
              <span className={`${step.status === "active" ? "text-case-text" : "text-case-text/90"}`}>{step.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-case-muted">{step.detail}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
