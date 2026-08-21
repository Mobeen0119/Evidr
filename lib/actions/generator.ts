import type { CaseAction, TruthCase } from "@/types/investigation";

export function generateActions(caseRecord: Pick<TruthCase, "id" | "claims" | "verdict" | "confidence" | "question" | "scenario">): CaseAction[] {
  const strongest = caseRecord.claims.find((c) => c.status === "contradicted" || c.status === "exaggerated") ?? caseRecord.claims.find((c) => c.status === "uncertain");
  const scenarioActions: CaseAction[] = caseRecord.scenario
    ? [
        {
          id: `action-scenario-${caseRecord.id}`,
          caseId: caseRecord.id,
          label: `Evidence checklist: ${caseRecord.scenario.label}`,
          description: caseRecord.scenario.explanation,
          output: [
            "Documents worth gathering:",
            ...caseRecord.scenario.evidenceToGather.map((e) => `- ${e}`),
            "",
            "Suggested next steps:",
            ...caseRecord.scenario.suggestedActions.map((a) => `- ${a}`),
          ].join("\n"),
        },
      ]
    : [];
  return [
    ...scenarioActions,
    {
      id: `action-response-${caseRecord.id}`,
      caseId: caseRecord.id,
      label: "Generate response",
      description: "Create a controlled response that asks for evidence without overstating the finding.",
      output: strongest
        ? `Regarding "${strongest.text}": the available evidence does not support this claim as stated. Please provide the primary source, the methodology, the exact metric and endpoint used, and any independent corroboration before I rely on this. The overall assessment for this case is ${caseRecord.verdict.toUpperCase()} at ${caseRecord.confidence}% confidence.`
        : `I reviewed the claims against the available material (assessment: ${caseRecord.verdict.toUpperCase()}, ${caseRecord.confidence}% confidence). Before relying on these conclusions, I would like primary-source or independent corroboration.`
    },
    { id: `action-report-${caseRecord.id}`, caseId: caseRecord.id, label: "Create report", description: "Generate a printable investigation report with receipts." },
    { id: `action-save-${caseRecord.id}`, caseId: caseRecord.id, label: "Save evidence", description: "Preserve extracted claims, sources, and evidence relationships in this case." },
    { id: `action-watch-${caseRecord.id}`, caseId: caseRecord.id, label: "Monitor this source", description: "Create a manual watch configuration that can later be connected to scheduled jobs." }
  ];
}
