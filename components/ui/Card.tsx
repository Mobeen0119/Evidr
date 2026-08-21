import { twMerge } from "tailwind-merge";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={twMerge("dossier-card border border-case-border bg-case-panel/90 p-5 shadow-evidence", className)}>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "amber" | "red" | "cyan" | "neutral" }) {
  const tones = {
    green: "border-case-green/40 text-case-green bg-case-green/10",
    amber: "border-case-amber/40 text-case-amber bg-case-amber/10",
    red: "border-case-red/40 text-case-red bg-case-red/10",
    cyan: "border-case-amber/40 text-case-amber bg-case-amber/10",
    neutral: "border-case-border text-case-muted bg-white/5"
  };
  return <span className={`inline-flex border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[.08em] ${tones[tone]}`}>{children}</span>;
}
