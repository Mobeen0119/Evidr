import { Card } from "@/components/ui/Card";
import type { SourceProfile as Source } from "@/types/investigation";

export function SourceProfile({ source }: { source?: Source }) {
  if (!source) return <Card><h2 className="font-mono text-sm uppercase tracking-[.22em] text-case-muted">Source Profile</h2><p className="mt-3 text-sm text-case-muted">Source intelligence unavailable in local mode. Add external search/Backboard tools for publisher history and corroboration.</p></Card>;
  return <Card><h2 className="mb-3 font-mono text-sm uppercase tracking-[.22em] text-case-muted">Source Profile</h2><h3 className="text-lg font-semibold">{source.publisher}</h3><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Authority" value={source.authority} /><Metric label="Transparency" value={source.transparency} /><Metric label="Independent" value={source.independentCorroboration} /></div><ul className="mt-4 space-y-2 text-sm text-case-muted">{source.history.map((h) => <li key={h}>— {h}</li>)}</ul></Card>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div><div className="text-xs uppercase text-case-muted">{label}</div><div className="mt-1 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-case-cyan" style={{ width: `${value}%` }} /></div></div>; }
