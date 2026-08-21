"use client";
import { useState } from "react";
import { BellRing, Plus, RefreshCw } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import type { Watch } from "@/types/investigation";

interface Props {
  caseId: string;
  watches: Watch[];
}

export function WatchPanel({ caseId, watches: initial }: Props) {
  const [watches, setWatches] = useState(initial);
  const [target, setTarget] = useState("");
  const [checking, setChecking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function checkNow() {
    setChecking(true);
    setFeedback("");
    try {
      const res = await fetch(`/api/watch/${caseId}/check`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setWatches((prev) => prev.map((w) => (data.watch && w.id === data.watch.id ? data.watch : w)));
      setFeedback(data.development);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Check failed");
    } finally {
      setChecking(false);
    }
  }

  async function addWatch() {
    setAdding(true);
    setFeedback("");
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, target: target.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create watch");
      setWatches((prev) => [data.watch, ...prev]);
      setTarget("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not create watch");
    } finally {
      setAdding(false);
    }
  }

  const isDevelopment = feedback.startsWith("NEW DEVELOPMENT");

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-[.22em] text-case-muted">
        <BellRing size={15} className="text-case-cyan" />
        Watchlist
      </h2>

      <div className="mb-4 flex gap-2">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Watch a source, claim, or topic…"
          className="min-w-0 flex-1 rounded-lg border border-case-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-case-cyan"
        />
        <button
          onClick={addWatch}
          disabled={adding || !target.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-case-border px-3 py-2 text-sm text-case-text transition hover:border-case-cyan/60 disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {feedback && (
        <div className={`mb-4 rounded-xl border p-4 text-sm ${isDevelopment ? "border-case-red/50 bg-case-red/5" : "border-case-border bg-black/20"}`}>
          {isDevelopment && <div className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-case-red">New development</div>}
          <div className="whitespace-pre-wrap leading-6 text-case-muted">{feedback}</div>
        </div>
      )}

      <div className="space-y-2">
        {watches.map((watch) => (
          <div key={watch.id} className="flex items-center justify-between gap-3 rounded-lg border border-case-border bg-black/20 px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm text-case-text">{watch.target}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-case-muted">
                <Badge>{watch.cadence}</Badge>
                {watch.lastChecked ? <span>last checked {new Date(watch.lastChecked).toLocaleString()}</span> : <span>never checked</span>}
              </div>
            </div>
            <button
              onClick={checkNow}
              disabled={checking}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-text transition hover:border-case-cyan/60 disabled:opacity-50"
            >
              <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
              {checking ? "Checking…" : "Check now"}
            </button>
          </div>
        ))}
        {!watches.length && <p className="text-sm text-case-muted">No watches configured.</p>}
      </div>
    </Card>
  );
}
