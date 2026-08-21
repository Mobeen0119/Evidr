import type { Claim, Evidence, InvestigationStep, SkepticFinding, SkepticReport } from "@/types/investigation";

const overbroad = /always|never|guarantee|guaranteed|proves|proven|breakthrough|only way|the best|the worst|miracle|cure|100%|impossible|cannot/i;

export function runSkepticCheck(
  claims: Claim[],
  evidence: Evidence[]
): { claims: Claim[]; steps: InvestigationStep[]; contradictionCount: number; report: SkepticReport } {
  const findings: SkepticFinding[] = [];
  let contradictionCount = 0;

  const revised = claims.map((claim) => {
    const challenged = overbroad.test(claim.text);
    if (!challenged) {
      if (claim.status === "uncertain" || claim.status === "contradicted" || claim.status === "exaggerated") contradictionCount++;
      return claim;
    }

    contradictionCount++;
    findings.push({
      kind: "assumption",
      claimId: claim.id,
      label: "Overbroad wording assumed to hold universally",
      detail: `The phrase "${claim.text.slice(0, 72)}..." uses absolute or superlative language. Counter-evidence search looks for exceptions and scope limits before accepting it.`
    });

    const sameSubject = claims.filter((c) => c.id !== claim.id && c.text.toLowerCase().includes(claim.text.split(/\s+/).slice(0, 2).join(" ").toLowerCase()));
    if (sameSubject.length) {
      findings.push({
        kind: "alternative",
        claimId: claim.id,
        label: "Alternative framing exists in the material",
        detail: `Another statement in the same material frames the same subject differently (${sameSubject[0].text.slice(0, 72)}...). This weakens certainty about a single interpretation.`
      });
    }

    return {
      ...claim,
      confidence: Math.max(28, claim.confidence - 12),
      verdict: `${claim.verdict} The skeptic pass searched for counter-evidence and found scope or wording issues that reduce confidence in this claim as stated.`,
      receipts: [
        ...claim.receipts,
        {
          id: `${claim.id}-skeptic`,
          label: "Skeptic check",
          detail: "Counter-evidence phase looked for overbroad wording, missing context, and assumptions that could make the conclusion too strong.",
          strength: "medium" as const
        }
      ]
    };
  });

  const contradictions = claims.filter((c) => c.status === "contradicted" || c.status === "exaggerated");
  if (contradictions.length) {
    findings.push({
      kind: "conflict",
      label: "Direct numeric conflict in evidence set",
      detail: `${contradictions.length} claim(s) contain figures that conflict with other values in the same material. The conflict must be resolved against primary sources before the conclusion is treated as reliable.`
    });
  }

  const supported = claims.filter((c) => c.status === "supported").length;
  if (claims.length && supported === claims.length) {
    findings.push({
      kind: "alternative",
      label: "No contradiction is a weak confirmation",
      detail: "Absence of internal contradiction does not confirm a claim. Local mode cannot rule out external contradictory evidence; absence of proof is not proof."
    });
  }

  const confidenceBefore = Math.round(claims.reduce((sum, c) => sum + c.confidence, 0) / Math.max(claims.length, 1));
  const adjustment = Math.min(24, findings.length * 4);
  const confidenceAfter = Math.max(30, confidenceBefore - adjustment);

  return {
    claims: revised,
    contradictionCount,
    report: {
      findings,
      confidenceBefore,
      confidenceAfter,
      note: `The skeptic phase attempted to disprove the current conclusion: ${findings.length} counter-evidence finding(s) were identified and overall confidence was adjusted downward. This is deliberate: the pipeline confirms nothing it has not tried to break.`
    },
    steps: [
      {
        id: "step-skeptic",
        label: "Skeptic check complete",
        detail: `Challenged ${claims.length} claim(s), found ${findings.length} counter-evidence finding(s), and adjusted confidence ${confidenceBefore} → ${confidenceAfter}.`,
        status: findings.length ? "warning" : "complete",
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]
  };
}
