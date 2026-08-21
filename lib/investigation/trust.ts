import type { Claim, Evidence, TrustProfile } from "@/types/investigation";

export function buildTrustProfile(
  claims: Claim[],
  evidence: Evidence[],
  contradictions: number,
  hasUrl: boolean,
  fetchOk: boolean,
  syntheticLevel: TrustProfile["syntheticSignals"]
): TrustProfile {
  const supported = claims.filter((c) => c.status === "supported").length;
  const contradicted = claims.filter((c) => c.status === "contradicted").length;
  const exaggerated = claims.filter((c) => c.status === "exaggerated").length;
  const uncertain = claims.filter((c) => c.status === "uncertain").length;

  const claimSupport = claims.length ? Math.round((supported / claims.length) * 100) : 0;
  const evidenceQuality = evidence.length ? Math.round(evidence.reduce((sum, e) => sum + e.quality, 0) / evidence.length) : 0;

  const transparency = Math.max(10, Math.min(90, Math.round(48 + supported * 4 - contradicted * 8 - exaggerated * 6 - (fetchOk ? 8 : -10))));
  const independentSupport = 0;
  const sourceAuthority = hasUrl ? (fetchOk ? 58 : 34) : 44;

  const conclusion = buildConclusion({ supported, contradicted, exaggerated, uncertain, contradictions, syntheticLevel, fetchOk });

  return {
    sourceAuthority,
    evidenceQuality,
    claimSupport,
    transparency,
    independentSupport,
    contradictions,
    syntheticSignals: syntheticLevel,
    conclusion
  };
}

function buildConclusion(o: {
  supported: number;
  contradicted: number;
  exaggerated: number;
  uncertain: number;
  contradictions: number;
  syntheticLevel: TrustProfile["syntheticSignals"];
  fetchOk: boolean;
}): string {
  const parts: string[] = [];
  if (o.contradicted || o.exaggerated) {
    parts.push(`${o.contradicted + o.exaggerated} statement(s) contradict other numbers or facts in the same material.`);
  } else if (o.uncertain) {
    parts.push(`${o.uncertain} statement(s) use strong or absolute wording, which needs real evidence to back it up.`);
  } else {
    parts.push(`Nothing here contradicts itself, but that alone doesn't make it true.`);
  }
  if (!o.fetchOk) parts.push(`The page couldn't be loaded, so this is based only on what was typed in.`);
  return parts.join(" ");
}
