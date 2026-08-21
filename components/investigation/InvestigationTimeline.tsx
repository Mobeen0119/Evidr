"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import type { InvestigationStep } from "@/types/investigation";

export function InvestigationTimeline({ steps }: { steps: InvestigationStep[] }) {
  return <Card><h2 className="mb-4 font-mono text-sm uppercase tracking-[.22em] text-case-muted">Case Timeline</h2><div className="relative space-y-4 before:absolute before:left-[4.2rem] before:top-1 before:h-full before:w-px before:bg-case-border">{steps.map((step, i) => <motion.div key={step.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} className="relative grid grid-cols-[4rem_1fr] gap-5"><div className="font-mono text-xs text-case-muted">{step.at}</div><div className="relative rounded-xl border border-case-border bg-black/20 p-3"><span className={`absolute -left-[1.55rem] top-4 h-3 w-3 rounded-full ring-4 ring-case-bg ${step.status === "warning" ? "bg-case-amber" : "bg-case-green"}`} /><div className="text-sm text-case-text">{step.label}</div><p className="mt-1 text-sm text-case-muted">{step.detail}</p></div></motion.div>)}</div></Card>;
}
