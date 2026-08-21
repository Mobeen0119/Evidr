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
  grounded: boolean;
  overallSummary?: string;
  overallCitations: { title: string; url: string; note: string }[];
  verifiedClaims: AiVerifiedClaim[];
  rawModel: string;
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiConfigured() {
  return isConfigured();
}

function buildPrompt(question: string, sourceContext: string, claims: Claim[]) {
  const claimList = claims.map((c, i) => `${i + 1}. [id:${c.id}] ${c.text}`).join("\n");

 return `You are helping an ordinary person figure out whether something they read or heard is true. Use web search and real sources before answering. Judge the actual claim, not merely what the submitted source says.

Rules:

- Write in simple language. Give the direct answer FIRST.
- This is fact-checking, not writing or wording analysis.
- NEVER treat a source saying something as proof that the thing itself is true.
- Wikipedia, books, religious texts, ancient texts, traditions, scholars, authorities, and popular belief can show that a claim was recorded, taught, or believed. They do NOT by themselves prove the underlying claim.
- Always separate:
  1. "The source says X."
  2. "People believe X."
  3. "X is actually true."
  Only #3 can be "supported" by evidence for X itself.
- If Wikipedia says Jesus existed, check the historical evidence for Jesus. Do not say "supported because Wikipedia says so."
- If a religious text says a miracle happened, that proves the text makes the claim, not that the miracle happened.
- Historical evidence that a religious figure existed does not automatically prove their miracles, divinity, revelation, resurrection, or other supernatural claims.
- Apply exactly the same standard to every religion and worldview.
- For supernatural claims, use "supported" only if there is independent evidence for the actual supernatural event. Otherwise use "uncertain". Do not call it "contradicted" unless reliable evidence shows it did not happen.
- Do not treat the number of believers, age of a religion, popularity, cultural importance, or authority of a text as evidence of truth.
- Repeated websites are not independent evidence if they copy the same original claim.
- Scientific claims should be judged by scientific evidence. Historical claims by historical evidence. Moral or philosophical claims should not be presented as scientific facts.
- "Supported" means credible evidence supports the underlying claim itself.
- "Contradicted" means reliable evidence conflicts with the underlying claim.
- "Exaggerated" means some evidence supports the claim but the wording goes beyond that evidence.
- "Uncertain" means the evidence is insufficient, conflicting, or the claim cannot be independently established.
- When in doubt between supported and uncertain, choose uncertain.
- Do not analyze whether the wording sounds risky or absolute unless that is actually the claim being checked.
- Only cite sources you actually found through search. Never invent sources or URLs.
- Match the language and script of the user's question.
- Return ONLY the JSON object below. Do not add any other text.

User's question: ${question || "Is this trustworthy?"}

What they submitted (may be partial):

"""

${sourceContext.slice(0, 6000)}

"""

Specific statements to check:

${claimList}

Respond with ONLY a single JSON object, exactly this shape:

{
  "overallSummary": "One short paragraph under 90 words. Give the direct answer first, then briefly explain why.",
  "overallCitations": [{"title": "source name", "url": "https://...", "note": "what it shows"}],
  "claims": [
    {
      "claimId": "the id given above",
      "status": "supported | uncertain | contradicted | exaggerated",
      "confidence": 0-100,
      "verdict": "One plain sentence explaining the verdict.",
      "citations": [{"title": "source name", "url": "https://...", "note": "what it shows"}]
    }
  ]
}`;
}

interface ParsedResponse {
  overallSummary?: string;
  overallCitations?: { title: string; url: string; note: string }[];
  claims?: AiVerifiedClaim[];
}

function parseResponseText(combined: string): ParsedResponse | null {
  const jsonMatch = combined.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as ParsedResponse;
  } catch {
    return null;
  }
}

function extractText(data: any): string {
  const parts: string[] = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean) ?? [];
  return parts.join("\n").trim();
}

function extractGroundingSources(data: any): { title: string; url: string; note: string }[] {
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  return chunks
    .map((c: any) => ({ title: c?.web?.title ?? "", url: c?.web?.uri ?? "", note: "Found via live web search" }))
    .filter((c: { title: string; url: string }) => c.url.startsWith("http"))
    .slice(0, 5);
}

export async function verifyClaimsWithGemini(params: {
  question: string;
  sourceContext: string;
  claims: Claim[];
}): Promise<AiVerificationResult> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const empty = { verifiedClaims: [] as AiVerifiedClaim[], overallCitations: [] as { title: string; url: string; note: string }[], rawModel: model, grounded: false };

  if (!isConfigured()) {
    return { ok: false, error: "GEMINI_API_KEY not set", ...empty };
  }
  if (params.claims.length === 0) {
    return { ok: true, ...empty };
  }

  const apiKey = process.env.GEMINI_API_KEY as string;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = buildPrompt(params.question, params.sourceContext, params.claims);

  async function callGrounded() {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2 }
      })
    });
  }

  async function callUngrounded() {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      })
    });
  }

  try {
    let response = await callGrounded();
    let grounded = true;
    if (!response.ok) {
      response = await callUngrounded();
      grounded = false;
    }

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Gemini API error ${response.status}: ${text.slice(0, 300)}`, ...empty };
    }

    const data = await response.json();
    const combined = extractText(data);
    const parsed = parseResponseText(combined);
    if (!parsed) {
      return { ok: false, error: "Model did not return parseable JSON", ...empty };
    }

    const groundingSources = grounded ? extractGroundingSources(data) : [];
    const overallCitations = (parsed.overallCitations ?? []).filter((c) => c?.url?.startsWith("http"));
    const mergedOverallCitations = overallCitations.length > 0 ? overallCitations : groundingSources;

    const verifiedClaims = (parsed.claims ?? [])
      .filter((c) => c && typeof c.claimId === "string" && ["supported", "uncertain", "contradicted", "exaggerated"].includes(c.status))
      .map((c) => ({ ...c, citations: (c.citations ?? []).filter((cit) => cit.url && cit.url.startsWith("http")) }));

    return {
      ok: true,
      grounded,
      overallSummary: parsed.overallSummary,
      overallCitations: mergedOverallCitations,
      verifiedClaims,
      rawModel: model
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error calling Gemini API", ...empty };
  }
}
