"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Copy, FileText, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { CaseAction } from "@/types/investigation";

const actionIcon: Record<string, React.ReactNode> = {
  "Generate response": <Lightbulb size={17} className="text-case-cyan" />,
  "Create report": <FileText size={17} className="text-case-cyan" />
};

export function ActionEngine({ actions, caseId }: { actions: CaseAction[]; caseId: string }) {
  const [copied, setCopied] = useState<string>();
  const [open, setOpen] = useState<string>();

  async function copy(action: CaseAction) {
    if (!action.output) return;
    try {
      await navigator.clipboard.writeText(action.output);
      setCopied(action.id);
      setTimeout(() => setCopied(undefined), 1600);
    } catch {
      
    }
  }

  return (
    <Card>
      <h2 className="mb-4 font-mono text-sm uppercase tracking-[.22em] text-case-muted">What do you want to do?</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <div key={action.id} className="flex flex-col rounded-xl border border-case-border bg-black/20 p-4">
            <div className="flex items-center gap-2">
              {actionIcon[action.label]}
              <h3 className="text-sm font-semibold text-case-text">{action.label}</h3>
            </div>
            <p className="mt-2 flex-1 text-sm leading-5 text-case-muted">{action.description}</p>
            {action.output && (
              <div className="mt-3">
                <button
                  onClick={() => setOpen(open === action.id ? undefined : action.id)}
                  className="text-xs font-medium text-case-cyan hover:underline"
                >
                  {open === action.id ? "Hide draft" : "Show draft"}
                </button>
                {open === action.id && (
                  <div className="relative mt-2 rounded-lg border border-case-border bg-black/30 p-3">
                    <pre className="whitespace-pre-wrap text-xs leading-5 text-case-text">{action.output}</pre>
                    <button
                      onClick={() => copy(action)}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-case-border bg-case-panel px-2 py-1 text-[11px] text-case-muted hover:text-case-text"
                    >
                      {copied === action.id ? <Check size={12} className="text-case-green" /> : <Copy size={12} />}
                      {copied === action.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {action.label === "Create report" && (
              <Link href={`/reports/${caseId}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-case-cyan hover:underline">
                <FileText size={13} /> Open printable report
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
