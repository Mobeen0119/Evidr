import type { Claim } from "@/types/investigation";

export interface AiVerifiedClaim {
  claimId: string;
  status: "supported" | "uncertain" | "contradicted" | "exaggerated";
  confidence: number;
  verdict: string;
  citations: { title: string; url: string; note: string }[];
}

export interface AiVerificationResult {
  ok: boolean;
  error?: string;
  verifiedClaims: AiVerifiedClaim[];
  rawModel: string;
}

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function aiVerificationConfigured() {
  return isConfigured();
}

function buildPrompt(question: string, sourceContext: string, claims: Claim[]) {
  const claimList = claims
    .map((c, i) => `${i + 1}. [id:${c.id}] ${c.text}`)
    .join("\n");

  return `You are verifying factual claims extracted from a piece of content a user wants to check the trustworthiness of.

User's question: ${question || "Is this trustworthy?"}

Source context (may be partial):
"""
${sourceContext.slice(0, 6000)}
"""

Claims to verify, one at a time, using web search where useful:
${claimList}

For each claim, search for independent, reputable sources that corroborate or contradict it. Respond ONLY with a JSON array, no prose, no markdown fences, in this exact shape:
[
  {
    "claimId": "the id given above",
    "status": "supported" | "uncertain" | "contradicted" | "exaggerated",
    "confidence": 0-100,
    "verdict": "one or two sentence explanation grounded in what you found",
    "citations": [{"title": "source title", "url": "https://...", "note": "what this source shows"}]
  }
]
Do not fabricate citations. If you cannot find a source for a claim, use status "uncertain" and an empty citations array.`;
}

export async function verifyClaimsWithAI(params: {
  question: string;
  sourceContext: string;
  claims: Claim[];
}): Promise<AiVerificationResult> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  if (!isConfigured()) {
    return { ok: false, error: "ANTHROPIC_API_KEY not set", verifiedClaims: [], rawModel: model };
  }
  if (params.claims.length === 0) {
    return { ok: true, verifiedClaims: [], rawModel: model };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: params.claims.length * 2 }],
        messages: [{ role: "user", content: buildPrompt(params.question, params.sourceContext, params.claims) }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Anthropic API error ${response.status}: ${text.slice(0, 300)}`, verifiedClaims: [], rawModel: model };
    }

    const data = await response.json();
    const textBlocks = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text);
    const combined = textBlocks.join("\n").trim();
    const jsonMatch = combined.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { ok: false, error: "Model did not return parseable JSON", verifiedClaims: [], rawModel: model };
    }

    const parsed = JSON.parse(jsonMatch[0]) as AiVerifiedClaim[];
    const cleaned = parsed.filter(
      (c) => c && typeof c.claimId === "string" && ["supported", "uncertain", "contradicted", "exaggerated"].includes(c.status)
    );
    return { ok: true, verifiedClaims: cleaned, rawModel: model };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error calling Anthropic API", verifiedClaims: [], rawModel: model };
  }
}
