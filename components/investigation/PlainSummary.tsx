import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ListChecks, LinkIcon } from "lucide-react";
import type { TruthCase } from "@/types/investigation";
import { plainVerdictLabel } from "@/lib/investigation/verdict";

const toneIcon = { green: CheckCircle2, amber: AlertTriangle, red: XCircle, neutral: HelpCircle };
const toneClass = {
  green: "text-case-green border-case-green/40 bg-case-green/10",
  amber: "text-case-amber border-case-amber/40 bg-case-amber/10",
  red: "text-case-red border-case-red/40 bg-case-red/10",
  neutral: "text-case-muted border-case-border bg-white/5"
};

export function PlainSummary({ item }: { item: TruthCase }) {
  const nothingToAnalyze = Boolean(item.sourceError) && item.claims.length === 0;

  if (nothingToAnalyze) {
    return (
      <div className="space-y-4">
        <div className={`border p-5 sm:p-6 ${toneClass.neutral}`}>
          <div className="flex items-start gap-3">
            <LinkIcon size={26} className="mt-0.5 shrink-0" />
            <div>
              <h2 className="font-heading text-2xl uppercase tracking-[.02em]">Couldn't check this link</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-case-text/90">{item.sourceError}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-case-muted">
                Try pasting the actual text instead — copy the article, message, or caption and paste it directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { headline, tone } = plainVerdictLabel(item.verdict);
  const Icon = toneIcon[tone];

  return (
    <div className="space-y-4">
      <div className={`border p-5 sm:p-6 ${toneClass[tone]}`}>
        <div className="flex items-start gap-3">
          <Icon size={26} className="mt-0.5 shrink-0" />
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-[.02em]">{headline}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-case-text/90">{item.summary}</p>
          </div>
        </div>
      </div>

      {item.aiCitations && item.aiCitations.length > 0 && (
        <div className="border border-case-border bg-case-panel p-5">
          <p className="text-xs uppercase tracking-[.14em] text-case-muted">Based on these sources, not just an opinion:</p>
          <ul className="mt-2 space-y-2">
            {item.aiCitations.map((c, i) => (
              <li key={i} className="text-sm">
                <a href={c.url} target="_blank" rel="noreferrer" className="text-case-amber hover:underline">
                  {c.title || c.url}
                </a>
                {c.note && <span className="text-case-muted"> — {c.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.sourceError && (
        <div className="border border-case-amber/40 bg-case-amber/10 p-4 text-sm text-case-text">
          Couldn't load the live page ({item.sourceError}) — this answer is based only on the text you typed alongside the link.
        </div>
      )}

      {item.languageNote && (
        <div className="border border-case-border bg-case-panel/60 p-4 text-sm text-case-muted">{item.languageNote}</div>
      )}

      {item.reference?.found && (
        <div className="border border-case-border bg-case-panel p-5">
          <p className="text-sm leading-6 text-case-text">
            This tool can't confirm your claim directly, but here's a related reference — read it and judge for yourself: <span className="font-heading uppercase tracking-[.04em] text-case-amber">{item.reference.title}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-case-muted">{item.reference.extract}</p>
          {item.reference.url && (
            <a href={item.reference.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-case-amber hover:underline">
              Read the full article →
            </a>
          )}
        </div>
      )}

      {item.scenario && (
        <div className="border border-case-border bg-case-panel p-5">
          <div className="flex items-center gap-2 font-heading text-sm uppercase tracking-[.08em] text-case-amber">
            <ListChecks size={16} /> What you can do
          </div>
          <p className="mt-2 text-sm leading-6 text-case-muted">{item.scenario.explanation}</p>
          {[...item.scenario.evidenceToGather, ...item.scenario.suggestedActions].length > 0 && (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-case-text marker:text-case-cyan">
              {[...item.scenario.evidenceToGather, ...item.scenario.suggestedActions].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-case-muted">
            This is general public information, not legal advice for your specific case. For anything with real money or legal risk on the line, check with a professional.
          </p>
        </div>
      )}
    </div>
  );
}
