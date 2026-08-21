import type { Report, TruthCase } from "@/types/investigation";
import { plainVerdictLabel } from "@/lib/investigation/verdict";

export function generateReport(caseRecord: TruthCase): Report {
  const label = plainVerdictLabel(caseRecord.verdict);
  const problemClaims = caseRecord.claims.filter((c) => c.status === "contradicted" || c.status === "exaggerated");
  const flaggedClaims = caseRecord.claims.filter((c) => c.status === "uncertain");
  const supportingEvidence = caseRecord.evidence.filter((e) => e.stance === "supports");
  const contradictingEvidence = caseRecord.evidence.filter((e) => e.stance === "contradicts");

  const lines = [
    `# What we found`,
    ``,
    `**${label.headline}**`,
    ``,
    caseRecord.summary,
    ``,
    `Checked on ${new Date(caseRecord.updatedAt).toLocaleDateString()}.`,
    ``
  ];

  if (caseRecord.aiCitations && caseRecord.aiCitations.length > 0) {
    lines.push(`## Based on these sources`, ``);
    for (const c of caseRecord.aiCitations) {
      lines.push(`- [${c.title || c.url}](${c.url})${c.note ? ` — ${c.note}` : ""}`);
    }
    lines.push(``);
  } else if (caseRecord.reference?.found) {
    lines.push(`## A related reference`, ``, `**${caseRecord.reference.title}**`, ``, caseRecord.reference.extract ?? "", ``);
    if (caseRecord.reference.url) lines.push(`[Read the full article](${caseRecord.reference.url})`, ``);
  }

  if (caseRecord.scenario) {
    lines.push(`## What you can do`, ``, caseRecord.scenario.explanation, ``);
    for (const item of [...caseRecord.scenario.evidenceToGather, ...caseRecord.scenario.suggestedActions]) {
      lines.push(`- ${item}`);
    }
    lines.push(``, `_This is general information, not legal advice for your specific situation._`, ``);
  }

  if (problemClaims.length > 0) {
    lines.push(`## Things that don't add up`, ``);
    for (const c of problemClaims) {
      lines.push(`- "${c.text}" — ${c.verdict}`);
    }
    lines.push(``);
  }

  if (flaggedClaims.length > 0) {
    lines.push(`## Worth a second look`, ``);
    for (const c of flaggedClaims) {
      lines.push(`- "${c.text}" — ${c.verdict}`);
    }
    lines.push(``);
  }

  if (supportingEvidence.length || contradictingEvidence.length) {
    lines.push(`## What we looked at`, ``);
    for (const e of supportingEvidence) lines.push(`- ${e.title}: ${e.excerpt}`);
    for (const e of contradictingEvidence) lines.push(`- ${e.title} (conflicts with the claim): ${e.excerpt}`);
    lines.push(``);
  }

  lines.push(
    `## How we checked this`,
    ``,
    `We looked for contradictions within what was submitted, checked the source where possible, and tried to argue against our own conclusion before settling on it. ${caseRecord.skeptic ? `In this case, that second-guessing pass changed our confidence from ${caseRecord.skeptic.confidenceBefore}% to ${caseRecord.skeptic.confidenceAfter}%.` : ""}`,
    ``,
    `This is not a certified legal or medical opinion — for anything with real stakes, confirm with a qualified professional or the original source yourself.`
  );

  return {
    id: `report-${caseRecord.id}`,
    caseId: caseRecord.id,
    title: `${caseRecord.title} — report`,
    markdown: lines.join("\n"),
    createdAt: new Date().toISOString()
  };
}
