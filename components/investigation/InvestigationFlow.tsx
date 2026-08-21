"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { InvestigationForm } from "@/components/dashboard/InvestigationForm";
import { AgentActivity } from "@/components/investigation/AgentActivity";
import { CheckCircle2 } from "lucide-react";
import type { InvestigationStep, PipelineEvent, VerdictStatus } from "@/types/investigation";

interface LiveState {
  steps: InvestigationStep[];
  running: boolean;
  error?: string;
  counts: { claims: number; evidence: number; contradictions: number } | null;
  skeptic: { confidenceBefore: number; confidenceAfter: number } | null;
  verdict: { verdict: VerdictStatus; confidence: number } | null;
}

const empty: LiveState = { steps: [], running: false, error: undefined, counts: null, skeptic: null, verdict: null };

export function InvestigationFlow() {
  const router = useRouter();
  const [live, setLive] = useState<LiveState>(empty);

  function upsertStep(step: { stepId: string; label: string; status: InvestigationStep["status"]; detail: string }) {
    setLive((prev) => {
      const existing = prev.steps.findIndex((s) => s.id === step.stepId);
      const entry: InvestigationStep = { id: step.stepId, label: step.label, detail: step.detail, status: step.status, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
      const steps = existing >= 0 ? prev.steps.map((s, i) => (i === existing ? entry : s)) : [...prev.steps, entry];
      return { ...prev, steps };
    });
  }

  async function start(question: string, input: string) {
    setLive({ ...empty, running: true });
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, input })
      });

      if (!res.ok) {
        let message = "Investigation failed";
        try {
          const data = await res.json();
          message = data.error ?? message;
        } catch { /* ignore */ }
        setLive((prev) => ({ ...prev, running: false, error: message }));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming not supported");

      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        let index: number;
        while ((index = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          if (!line) continue;
          const event = JSON.parse(line) as PipelineEvent;
          handleEvent(event);
        }
      }
    } catch (error) {
      setLive((prev) => ({ ...prev, running: false, error: error instanceof Error ? error.message : "Investigation failed" }));
    }
  }

  function handleEvent(event: PipelineEvent) {
    switch (event.type) {
      case "step":
        upsertStep({ stepId: event.stepId, label: event.label, status: event.status, detail: event.detail });
        break;
      case "counts":
        setLive((prev) => ({ ...prev, counts: { claims: event.claims, evidence: event.evidence, contradictions: event.contradictions } }));
        break;
      case "skeptic":
        setLive((prev) => ({ ...prev, skeptic: { confidenceBefore: event.confidenceBefore, confidenceAfter: event.confidenceAfter } }));
        break;
      case "verdict":
        setLive((prev) => ({ ...prev, verdict: { verdict: event.verdict, confidence: event.confidence } }));
        break;
      case "done":
        setLive((prev) => ({ ...prev, running: false }));
        setTimeout(() => router.push(`/cases/${event.caseId}`), 700);
        break;
      case "error":
        setLive((prev) => ({ ...prev, running: false, error: event.message }));
        break;
    }
  }

  const finished = live.verdict && !live.running;

  return (
    <div className="space-y-4">
      <InvestigationForm onSubmit={start} running={live.running} error={live.error} />
      {(live.running || live.steps.length > 0) && (
        <AgentActivity steps={live.steps} running={live.running} counts={live.counts ?? undefined} skeptic={live.skeptic ?? undefined} />
      )}
      {finished && live.verdict && (
        <div className="animate-case-in flex items-center gap-3 rounded-xl border border-case-green/40 bg-case-green/10 p-5">
          <CheckCircle2 size={22} className="shrink-0 text-case-green" />
          <p className="text-sm text-case-text">It's ready — taking you to your results...</p>
        </div>
      )}
    </div>
  );
}
