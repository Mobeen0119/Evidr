import Link from "next/link";
import { ArrowRight, Fingerprint, Link2, Scale, ShieldQuestion } from "lucide-react";
import { Shell } from "@/components/shared/Shell";
import { MiniGraph } from "@/components/landing/MiniGraph";

const loop = [
  { step: "01", label: "Investigate", detail: "Ingest a URL, document, message, or problem as an untrusted case." },
  { step: "02", label: "Connect", detail: "Extract claims, map sources, and build an interactive evidence graph." },
  { step: "03", label: "Challenge", detail: "A skeptic pass actively tries to disprove the current conclusion." },
  { step: "04", label: "Explain", detail: "Every claim ships with receipts — the chain of evidence behind each answer." },
  { step: "05", label: "Act", detail: "Draft a response, generate a report, or monitor the source for new evidence." }
];

export default function LandingPage() {
  return (
    <Shell>
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-72 w-[46rem] -translate-x-1/2 bg-case-amber/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-case-amber/30 bg-case-amber/10 px-3 py-1 font-mono text-[11px] tracking-[.24em] text-case-amber">
            <span className="stamp text-[9px]">CASE OPEN</span>
            <span>INVESTIGATE — CONNECT — CHALLENGE — EXPLAIN — ACT</span>
          </div>
          <h1 className="font-display text-5xl leading-[.95] tracking-[.01em] sm:text-8xl">
            <span className="redact-reveal">DON&apos;T&nbsp;TRUST&nbsp;IT.</span>
            <br />
            <span className="text-case-amber">INVESTIGATE&nbsp;IT.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-case-muted">
            Hand Sleuth a claim, source, document, or problem. It follows the evidence, tries to disprove its own conclusion, and shows you every receipt.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/investigate" className="inline-flex items-center justify-center gap-2 bg-case-amber px-7 py-3.5 font-heading text-sm uppercase tracking-[.1em] text-black transition hover:brightness-110">
              Open a Case <ArrowRight size={17} />
            </Link>
            <Link href="/cases/demo-medical-article" className="inline-flex items-center justify-center border border-case-border px-7 py-3.5 font-heading text-sm uppercase tracking-[.1em] text-case-text transition hover:border-case-amber/50 hover:text-case-amber">
              View Sample File
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldQuestion, label: "Clear, honest answers" },
              { icon: Link2, label: "Evidence graph" },
              { icon: Scale, label: "Skeptic check" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2 border border-case-border bg-case-panel/70 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-case-muted">
                <Icon size={14} className="shrink-0 text-case-amber" /> {label}
              </div>
            ))}
          </div>
        </div>

        <div className="evidence-pulse dossier-card mx-auto mt-16 max-w-4xl border border-case-border bg-case-panel p-5 shadow-evidence">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[.22em] text-case-muted">
            <Fingerprint size={15} className="text-case-amber" /> Evidence board — exhibit A
          </div>
          <MiniGraph />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="border border-case-border bg-case-panel/60 p-6 sm:p-10">
          <div className="flex items-baseline justify-between border-b border-case-border/70 pb-4">
            <h2 className="font-heading text-3xl uppercase tracking-[.04em]">Not another chatbot.</h2>
            <span className="stamp text-case-amber">Method</span>
          </div>
          <p className="mt-4 max-w-3xl text-case-muted">
            Sleuth exposes the structure of reasoning. Sources, claims, evidence, contradictions, and actions are separate,
            inspectable objects — not one wall of text.
          </p>
          <div className="animate-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {loop.map((item) => (
              <div key={item.step} className="border border-case-border bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-case-amber">{item.step}</span>
                </div>
                <h3 className="mt-2 font-heading text-sm uppercase tracking-[.06em] text-case-text">{item.label}</h3>
                <p className="mt-1.5 text-xs leading-5 text-case-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
