import { Card, Badge } from "@/components/ui/Card";
import type { Claim } from "@/types/investigation";

export function ReceiptsPanel({ claims }: { claims: Claim[] }) {
  return <Card><h2 className="mb-4 font-mono text-sm uppercase tracking-[.22em] text-case-muted">Receipts / Why believe this?</h2><div className="grid gap-4 lg:grid-cols-2">{claims.map((claim) => <details key={claim.id} className="rounded-xl border border-case-border bg-black/20 p-4" open={claim.status !== "supported"}><summary className="cursor-pointer text-sm font-medium text-case-text"><span className="mr-2">{claim.text}</span><Badge tone={claim.status === "supported" ? "green" : claim.status === "contradicted" ? "red" : "amber"}>{claim.status}</Badge></summary><div className="mt-4 space-y-3">{claim.receipts.map((r) => <div key={r.id} className="rounded-lg border border-case-border p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm text-case-text">{r.label}</span><Badge>{r.strength}</Badge></div><p className="mt-2 text-sm text-case-muted">{r.detail}</p></div>)}</div></details>)}</div></Card>;
}
