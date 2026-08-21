"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileStack } from "lucide-react";
import type { TruthCase } from "@/types/investigation";
import { PlainSummary } from "@/components/investigation/PlainSummary";
import { VerdictCard } from "@/components/investigation/VerdictCard";
import { TrustProfile } from "@/components/investigation/TrustProfile";
import { EvidenceGraph } from "@/components/investigation/EvidenceGraph";
import { ClaimList } from "@/components/investigation/ClaimList";
import { ReceiptsPanel } from "@/components/investigation/ReceiptsPanel";
import { SyntheticSignals } from "@/components/investigation/SyntheticSignals";
import { SkepticPanel } from "@/components/investigation/SkepticPanel";
import { InvestigationTimeline } from "@/components/investigation/InvestigationTimeline";
import { ActionEngine } from "@/components/investigation/ActionEngine";
import { WatchPanel } from "@/components/investigation/WatchPanel";
import { SourceProfile } from "@/components/investigation/SourceProfile";
import { Card } from "@/components/ui/Card";
import type { Claim } from "@/types/investigation";

export function CaseWorkspace({ item }: { item: TruthCase }) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | undefined>(item.claims[0]?.id);
  const [showFull, setShowFull] = useState(false);
  const refs = {
    claims: useRef<HTMLDivElement>(null),
    graph: useRef<HTMLDivElement>(null),
    actions: useRef<HTMLDivElement>(null),
    receipts: useRef<HTMLDivElement>(null)
  };

  function scrollTo(key: keyof typeof refs) {
    setShowFull(true);
    requestAnimationFrame(() => refs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function selectClaim(claim: Claim) {
    setSelectedClaimId(claim.id);
    scrollTo("claims");
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] uppercase tracking-[.18em] text-case-muted sm:text-xs sm:tracking-[.22em]">Case {item.id}</p>
          <h1 className="mt-2 break-words font-heading text-2xl uppercase tracking-[.01em] sm:text-3xl">{item.title}</h1>
          {item.fetchedTitle && <p className="mt-1 break-words text-sm text-case-muted">Source: {item.fetchedTitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[.14em] text-case-muted">{new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <PlainSummary item={item} />
      </motion.div>

      {!(item.sourceError && item.claims.length === 0) && (
        <>
          <button
            onClick={() => setShowFull((v) => !v)}
            className="flex items-center justify-center gap-2 border border-case-border bg-case-panel/60 py-3 font-heading text-sm uppercase tracking-[.1em] text-case-muted transition hover:border-case-amber/50 hover:text-case-amber"
          >
            <FileStack size={16} />
            {showFull ? "Hide full case file" : "Show full case file"}
            <ChevronDown size={16} className={`transition-transform ${showFull ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showFull && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 overflow-hidden"
          >
            <VerdictCard
              verdict={item.verdict}
              confidence={item.confidence}
              summary={item.summary}
              mode={item.mode}
              caseId={item.id}
              onNavigate={scrollTo}
            />

            <TrustProfile profile={item.trustProfile} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.75fr)]">
              <div ref={refs.graph} className="order-2 scroll-mt-24 xl:order-1">
                <EvidenceGraph claims={item.claims} evidence={item.evidence} relationships={item.relationships} onSelectClaim={selectClaim} />
              </div>
              <div ref={refs.claims} className="order-1 scroll-mt-24 xl:order-2">
                <ClaimList claims={item.claims} selectedId={selectedClaimId} onSelect={selectClaim} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div ref={refs.receipts} className="scroll-mt-24">
                <ReceiptsPanel claims={item.claims} />
              </div>
              <SyntheticSignals report={item.synthetic} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SkepticPanel report={item.skeptic} />
              <SourceProfile source={item.sourceProfile} />
            </div>

            <div ref={refs.actions} className="scroll-mt-24">
              <ActionEngine actions={item.actions} caseId={item.id} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <WatchPanel caseId={item.id} watches={item.watches} />
              <InvestigationTimeline steps={item.timeline} />
            </div>

            <Card className="border-dashed">
              <p className="text-center text-xs text-case-muted">
                Every conclusion above can be traced back to receipts. Click <span className="text-case-amber">Show receipts</span> on any claim to inspect the chain of evidence.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </section>
  );
}
