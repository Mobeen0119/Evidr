import { AlertOctagon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function SourceUnavailable({ reason, retry }: { reason: string; retry?: () => void }) {
  return (
    <Card className="border-case-amber/40">
      <div className="flex flex-wrap items-start gap-3">
        <AlertOctagon size={20} className="mt-0.5 text-case-amber" />
        <div className="flex-1">
          <h2 className="font-mono text-sm uppercase tracking-[.22em] text-case-amber">Source unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-case-muted">
            We couldn't access this source. <span className="text-case-text">{reason}</span>
          </p>
          <p className="mt-1 text-sm text-case-muted">The case was preserved so other evidence can still be investigated or the source retried later.</p>
          {retry && (
            <button onClick={retry} className="mt-3 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-text transition hover:border-case-amber/60">
              Retry source fetch
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
