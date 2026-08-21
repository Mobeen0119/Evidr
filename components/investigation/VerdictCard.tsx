"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, FileText, Network, ScrollText, Sparkles } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import type { InvestigationMode, VerdictStatus } from "@/types/investigation";
import { plainVerdictLabel } from "@/lib/investigation/verdict";

const toneFor = (verdict: VerdictStatus) =>
  verdict === "contradicted" || verdict === "insufficient-evidence" ? "red" : verdict === "uncertain" ? "amber" : "green";

function CountUp({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 22 });
  const ref = useRef<HTMLSpanElement>(null);
  const text = useTransform(spring, (v) => `${Math.round(v)}%`);
  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);
  useEffect(() => {
    const unsub = text.on("change", (latest) => {
      if (ref.current) ref.current.textContent = latest;
    });
    return unsub;
  }, [text]);
  return <span ref={ref}>0%</span>;
}

interface Props {
  verdict: VerdictStatus;
  confidence: number;
  summary: string;
  mode?: InvestigationMode;
  caseId?: string;
  compact?: boolean;
  onNavigate?: (section: "claims" | "graph" | "actions" | "receipts") => void;
}

function modeLabel(mode: InvestigationMode): string {
  if (mode === "demo") return "DEMO DATA";
  if (mode === "live-local") return "BASIC CHECK";
  return "ENHANCED CHECK";
}

export function VerdictCard({ verdict, confidence, summary, mode, caseId, compact, onNavigate }: Props) {
  const tone = toneFor(verdict);
  return (
    <Card className="border-case-cyan/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[.22em] text-case-muted">Status</div>
          <h1 className="mt-2 text-2xl font-semibold uppercase tracking-wide">{plainVerdictLabel(verdict).headline}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-3xl text-case-text">
              <CountUp value={confidence} />
            </div>
            <div className="text-[11px] uppercase tracking-widest text-case-muted">Confidence</div>
          </div>
          {mode && <Badge tone={mode === "demo" ? "amber" : "cyan"}>{modeLabel(mode)}</Badge>}
        </div>
      </div>
      <p className="mt-4 max-w-4xl text-sm leading-6 text-case-muted">{summary}</p>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-case-border pt-4">
        {onNavigate && (
          <>
            <button onClick={() => onNavigate("receipts")} className="inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted transition hover:border-case-cyan/60 hover:text-case-text">
              <ScrollText size={14} /> Show receipts
            </button>
            <button onClick={() => onNavigate("graph")} className="inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted transition hover:border-case-cyan/60 hover:text-case-text">
              <Network size={14} /> Evidence graph
            </button>
            <button onClick={() => onNavigate("actions")} className="inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted transition hover:border-case-cyan/60 hover:text-case-text">
              <ArrowDown size={14} /> What next?
            </button>
          </>
        )}
        {caseId && (
          <Link href={`/reports/${caseId}`} className="inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted transition hover:border-case-cyan/60 hover:text-case-text">
            <FileText size={14} /> Generate report
          </Link>
        )}
        {compact && (
          <span className="ml-auto inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted">
            <Sparkles size={14} className="text-case-cyan" /> Opening case workspace…
          </span>
        )}
      </div>
    </Card>
  );
}
