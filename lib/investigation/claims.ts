import type { Claim, ClaimStatus, CreateCaseInput, Receipt, TruthCase } from "@/types/investigation";

const sentenceBoundary = /(?<=[.!?])\s+/g;
const stopWords = new Set(["the", "this", "that", "these", "those", "their", "there", "from", "with", "into", "after", "about", "which", "while", "being", "were", "been", "will", "would", "shall", "should", "could", "might", "must", "more", "most", "very", "much", "many", "some", "such", "than", "then", "when", "what", "who", "whom", "your", "our", "their", "have", "has", "had", "does", "doing", "they", "them", "he", "she", "his", "her", "its", "was", "are", "for", "and", "but", "not", "you", "all", "any", "can", "may"]);

export interface NumericMetric {
  value: number;
  unit: string;
  raw: string;
}

export function extractNumericMetrics(sentence: string): NumericMetric[] {
  const metrics: NumericMetric[] = [];
  const patterns: RegExp[] = [
    /(\d+(?:\.\d+)?)\s*(%|percent|percentage)/gi,
    /[$£€]\s?(\d+(?:\.\d+)?)/g,
    /(\d+(?:,\d{3})+)(?:\.\d+)?/g,
    /\b(\d+(?:\.\d+)?)\s*(participants|patients|people|respondents|hospitals|companies|employees|stores|users|customers|pages|days|weeks|months|years|million|billion|trillion|times|x|points|kilometers|km|miles|degrees|kg|gb|tb|cores|watt|watts|inches|hr|hz)/gi
  ];
  for (const pattern of patterns) {
    for (const match of sentence.matchAll(pattern)) {
      const raw = match[0];
      const numRaw = match[1] ?? match[0].replace(/[^0-9.,]/g, "");
      const value = Number(numRaw.replace(/,/g, ""));
      if (Number.isFinite(value)) {
        const unit = (match[0].match(/(%|percent|participants|patients|people|respondents|hospitals|companies|employees|stores|users|customers|pages|days|weeks|months|years|million|billion|trillion|times|points|kilometers|km|miles|degrees|kg|gb|tb|cores|watt|watts|inches|hr|hz)/i)?.[0] ?? "").toLowerCase();
        metrics.push({ value, unit: unit || "count", raw });
      }
    }
  }
  return metrics;
}

const strongTerms =
  /always|never|guarantee|guaranteed|proves|proven|breakthrough|certainly|undeniably|absolutely|definitely|the best|the worst|only way|miracle|secret|shocking|cannot|impossible|cure|curable|cures|cure-all|fully reverse|100%|banned|illegal|fraud|scam|eliminates|instantly|permanently|risk-free|zero side effects|doctors hate|big pharma/i;

function subjectKey(sentence: string): string {
  const words = sentence
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 3 && !stopWords.has(w) && !/^\d/.test(w));
  const significant = words.filter((w) => !/^(increases?|decreases?|improves?|reduces?|shows?|found|claims?|says?|reported?|states?|raises?|lowers?|rises?|falls?|grows?|adds?|cuts?|offers?|provides?|treats?|works?|helps?|causes?)/.test(w));
  return significant.slice(0, 2).join(" ") || words.slice(0, 2).join(" ");
}

function computeStatus(): ClaimStatus {
  return "uncertain";
}

export function detectContradictions(claims: Claim[]): Claim[] {
  const groups = new Map<string, { claimId: string; value: number }[]>();
  for (const claim of claims) {
    const metrics = extractNumericMetrics(claim.text);
    for (const metric of metrics) {
      if (metric.unit === "count") continue;
      const key = `${subjectKey(claim.text)}|${metric.unit}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ claimId: claim.id, value: metric.value });
    }
  }

  const outliers = new Set<string>();
  const conflicts = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.value - b.value);

    if (sorted.length === 2) {
      const [smaller, larger] = sorted;
      if (larger.value / Math.max(smaller.value, 1) > 1.35) {
        outliers.add(larger.claimId);
        conflicts.set(larger.claimId, smaller.claimId);
      }
      continue;
    }

    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 1 ? sorted[mid].value : (sorted[mid - 1].value + sorted[mid].value) / 2;
    for (const item of group) {
      const ratio = item.value / Math.max(median, 1);
      if (ratio > 1.35 || ratio < 0.74) {
        outliers.add(item.claimId);
        const other = group.find((g) => g.claimId !== item.claimId);
        if (other) conflicts.set(item.claimId, other.claimId);
      }
    }
  }

  return claims.map((claim) => {
    if (!outliers.has(claim.id)) return claim;
    const otherId = conflicts.get(claim.id);
    const status: ClaimStatus = extractNumericMetrics(claim.text).some((m) => m.unit === "%" || m.unit === "percent") ? "exaggerated" : "contradicted";
    return {
      ...claim,
      status,
      confidence: 38,
      verdict: `Internal consistency analysis found a materially different value stated elsewhere in the same material${otherId ? ` (see ${otherId})` : ""}. The larger claim is flagged; the discrepancy needs primary-source resolution.`,
      receipts: [
        ...claim.receipts,
        {
          id: `${claim.id}-conflict`,
          label: "Internal contradiction",
          detail: `A numeric assertion in this claim conflicts with another value present in the same material. One figure is likely incorrect or contextually different.`,
          strength: "high"
        }
      ]
    };
  });
}

const BOILERPLATE_PATTERNS = [
  /^(sign in|sign up|log in|log out|reload to refresh|you signed (in|out)|skip to (main )?content)/i,
  /^(cookie|privacy policy|terms of service|terms and conditions)( notice| settings)?$/i,
  /^(menu|navigation|search|subscribe|follow us|share this|read more|learn more|click here)$/i,
  /^(copyright|all rights reserved|©)/i,
  /^\d+\s*(comments?|shares?|likes?|views?)$/i,
  /^(home|about|contact|blog|pricing|features|products?)( \| .*)?$/i,
  /javascript is disabled|enable javascript|browser (does not|doesn'?t) support/i,
  /^(loading|please wait)\.{0,3}$/i
];

function isBoilerplate(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (BOILERPLATE_PATTERNS.some((p) => p.test(trimmed))) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && !/[.!?]$/.test(trimmed)) return true;
  const alphaRatio = (trimmed.match(/[a-zA-Z]/g)?.length ?? 0) / Math.max(trimmed.length, 1);
  if (alphaRatio < 0.5) return true;
  const jsonLikeMatches = (trimmed.match(/[{}[\]]|[a-zA-Z_]+:[a-zA-Z0-9_{["']/g) ?? []).length;
  if (jsonLikeMatches >= 3) return true;
  if (/nodeType|contentful|payload:|:\[\{|\}\],/.test(trimmed)) return true;
  return false;
}

export function extractClaims(input: CreateCaseInput, caseId: string): Claim[] {
  const material = input.input.trim();
  const text = (material || input.question.trim()).replace(/\s+/g, " ").trim();
  const sentences = text
    .split(sentenceBoundary)
    .filter((s) => s.trim().length > 24)
    .filter((s) => !isBoilerplate(s))
    .slice(0, 12);
  const candidates = sentences.length ? sentences : [text || "User submitted an investigation request."];

  const scored = candidates
    .map((sentence, index) => {
      const clean = sentence.replace(/["“”]/g, "").trim();
      const metrics = extractNumericMetrics(clean);
      const isStrong = strongTerms.test(clean);
      let score = metrics.length * 3 + (isStrong ? 2 : 0) + Math.min(clean.length / 40, 2);
      return { index, clean, metrics, isStrong, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .sort((a, b) => a.index - b.index);

  const base: Claim[] = scored.map(({ clean, metrics, isStrong }, index) => {
    const status = computeStatus();
    const metric = metrics[0];
    const receipts: Receipt[] = [
      {
        id: `receipt-source-${caseId}-${index}`,
        label: "Source claim captured",
        detail: "This exact statement was found in what you submitted.",
        strength: "high"
      }
    ];
    if (metric) {
      receipts.push({
        id: `receipt-metric-${caseId}-${index}`,
        label: "Contains a specific number",
        detail: `Detected value: ${metric.raw}. This has not been checked against an outside source.`,
        strength: "medium"
      });
    }
    if (isStrong) {
      receipts.push({
        id: `receipt-strong-${caseId}-${index}`,
        label: "Absolute or promotional wording",
        detail: "This uses strong, all-or-nothing language (e.g. \"always\", \"cures\", \"guaranteed\"), which is a common pattern in overstated or misleading claims.",
        strength: "medium"
      });
    }
    receipts.push({
      id: `receipt-scope-${caseId}-${index}`,
      label: "Not independently checked",
      detail: "No outside source was searched to confirm or deny this. Treat it as unverified until you check a primary source yourself.",
      strength: "low"
    });

    return {
      id: `claim-${index + 1}`,
      caseId,
      text: clean,
      status,
      confidence: isStrong || metric ? 30 : 42,
      sourceClaim: `Submitted material states: ${clean}`,
      primarySource: metric ? `Detected measurable assertion: ${metric.raw} (${metric.unit})` : undefined,
      independentSources: [],
      flagged: isStrong,
      verdict: isStrong
        ? "This is a strong, absolute claim. Claims like this need real evidence — a study, an official source, or an expert — not just being stated confidently."
        : "This has not been independently verified. It may be true, but nothing here confirms it.",
      receipts
    } satisfies Claim;
  });

  return detectContradictions(base);
}

export function detectInputType(input: string): TruthCase["inputType"] {
  if (/^https?:\/\//i.test(input.trim())) return "url";
  if (/policy|email|appeal|rejected|company|problem/i.test(input)) return "problem";
  return "text";
}
