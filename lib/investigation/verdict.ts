import type { Claim, TruthCase, VerdictStatus } from "@/types/investigation";

export function computeVerdict(claims: Claim[], confidence: number): { verdict: VerdictStatus; confidence: number } {
  if (!claims.length) return { verdict: "insufficient-evidence", confidence: Math.max(20, Math.round(confidence / 2)) };

  const supported = claims.filter((c) => c.status === "supported").length;
  const contradicted = claims.filter((c) => c.status === "contradicted").length;
  const exaggerated = claims.filter((c) => c.status === "exaggerated").length;
  const problem = contradicted + exaggerated;
  const total = claims.length;

  const verdict: VerdictStatus =
    problem === 0 && supported === total
      ? "supported"
      : problem > 0 && supported >= problem
        ? "partially-supported"
        : problem > supported
          ? "contradicted"
          : supported === 0
            ? claims.some((c) => c.flagged)
              ? "uncertain"
              : "insufficient-evidence"
            : "uncertain";

  const confidenceAdjust =
    verdict === "contradicted" ? -22 : verdict === "partially-supported" ? -12 : verdict === "uncertain" ? -14 : -4;
  return { verdict, confidence: Math.max(18, Math.min(96, Math.round(confidence + confidenceAdjust))) };
}

export function plainVerdictLabel(verdict: VerdictStatus): { headline: string; tone: "green" | "amber" | "red" | "neutral" } {
  switch (verdict) {
    case "supported":
      return { headline: "This checks out", tone: "green" };
    case "contradicted":
      return { headline: "This doesn't add up", tone: "red" };
    case "partially-supported":
      return { headline: "Some of this is true, some isn't", tone: "amber" };
    case "uncertain":
      return { headline: "This uses risky, absolute wording", tone: "amber" };
    default:
      return { headline: "We can't confirm this either way", tone: "neutral" };
  }
}

export function verdictSummary(item: Pick<TruthCase, "verdict" | "trustProfile" | "claims">): string {
  const { claims, verdict } = item;
  if (!claims.length) {
    return "There wasn't enough here to check. Add a source, document, or a bit more detail and try again.";
  }

  switch (verdict) {
    case "contradicted":
      return "This doesn't add up — parts of it contradict each other or conflict with other numbers in the same material. That's a strong sign something here is wrong or exaggerated.";
    case "partially-supported":
      return "Part of this is accurate. Part of it isn't — some details conflict with each other or don't hold up. Worth double-checking before you rely on it.";
    case "supported":
      return "This holds up against outside sources. Still worth checking the original yourself for anything that really matters.";
    case "uncertain":
      return "This uses strong, all-or-nothing language — words like \"always\", \"guaranteed\", or \"cures\". That kind of wording is common in overstated or misleading claims, so treat it carefully.";
    default:
      return "We can't confirm this is true or false. That doesn't mean it's wrong — it just means nothing here has been checked against an outside source yet.";
  }
}
