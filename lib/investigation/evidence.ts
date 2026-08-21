import type { Claim, Evidence, EvidenceRelationship } from "@/types/investigation";

export interface EvidenceBuildInput {
  caseId: string;
  input: string;
  analysisText: string;
  fetchOk: boolean;
  fetchedTitle?: string;
  fetchedUrl?: string;
  claims: Claim[];
}

export function buildEvidence(build: EvidenceBuildInput): Evidence[] {
  const { caseId, input, analysisText, fetchOk, fetchedTitle, fetchedUrl, claims } = build;
  const isUrl = /^https?:\/\//i.test(input.trim());
  const evidence: Evidence[] = [];

  evidence.push({
    id: "source-submission",
    caseId,
    title: isUrl ? "Submitted URL" : "Submitted material",
    kind: isUrl ? "source" : "document",
    excerpt: input.slice(0, 240) || "User supplied source material.",
    url: isUrl ? input : undefined,
    quality: fetchOk ? 64 : 42,
    stance: "context"
  });

  if (isUrl) {
    evidence.push({
      id: "fetched-content",
      caseId,
      title: fetchedTitle ? `Fetched page: ${fetchedTitle}` : "Fetched page content",
      kind: "source",
      excerpt: fetchOk ? `${analysisText.slice(0, 220)}${analysisText.length > 220 ? "..." : ""}` : "Page could not be fetched; only the submitted URL string is available.",
      url: fetchedUrl ?? input,
      quality: fetchOk ? 72 : 0,
      stance: fetchOk ? "context" : "neutral"
    });
  }

  evidence.push({
    id: "local-analysis",
    caseId,
    title: "Local consistency analysis",
    kind: "analysis",
    excerpt: `Deterministic analysis parsed ${analysisText.split(/\s+/).length || "?"} words into ${claims.length} claim(s) and checked internal numeric consistency, strong language, and evidence gaps.`,
    quality: 70,
    stance: "neutral"
  });

  for (const claim of claims) {
    if (claim.status === "contradicted" || claim.status === "exaggerated") {
      evidence.push({
        id: `conflict-${claim.id}`,
        caseId,
        title: `Internal discrepancy flagged for claim`,
        kind: "metric",
        excerpt: claim.primarySource
          ? `The claim carries a measurable assertion (${claim.primarySource}) that conflicts with other values in the same material.`
          : "A conflicting value appears elsewhere in the same material.",
        quality: 84,
        stance: "contradicts"
      });
    }
  }

  return evidence;
}

export function buildRelationships(caseId: string, claims: Claim[], evidence: Evidence[]): EvidenceRelationship[] {
  const relationships: EvidenceRelationship[] = [];
  const hasFetched = evidence.some((e) => e.id === "fetched-content");

  for (const claim of claims) {
    relationships.push({
      id: `rel-source-${claim.id}`,
      caseId,
      fromId: "source-submission",
      toId: claim.id,
      type: "cites",
      rationale: "The submitted source contains this claim."
    });
    if (hasFetched) {
      relationships.push({
        id: `rel-fetched-${claim.id}`,
        caseId,
        fromId: "fetched-content",
        toId: claim.id,
        type: "cites",
        rationale: "The fetched page text was the basis for extracting this claim."
      });
    }
    relationships.push({
      id: `rel-analysis-${claim.id}`,
      caseId,
      fromId: "local-analysis",
      toId: claim.id,
      type: claim.status === "supported" ? "supports" : "related_to",
      rationale: "Local extraction identified the claim and assessed internal support limits."
    });
    if (evidence.some((e) => e.id === `conflict-${claim.id}`)) {
      relationships.push({
        id: `rel-conflict-${claim.id}`,
        caseId,
        fromId: `conflict-${claim.id}`,
        toId: claim.id,
        type: claim.status === "exaggerated" ? "disputes" : "contradicts",
        rationale: "The flagged discrepancy conflicts with this claim as stated."
      });
    }
  }
  return relationships;
}
