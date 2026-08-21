export interface WikiReference {
  found: boolean;
  title?: string;
  extract?: string;
  url?: string;
}

const stopWords = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "this", "that", "these", "those",
  "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "its", "our", "their",
  "and", "or", "but", "if", "so", "of", "in", "on", "at", "to", "for", "with", "as", "by", "from",
  "heard", "said", "says", "say", "think", "believe", "claim", "claims", "always", "never", "can", "cannot",
  "will", "would", "could", "should", "has", "have", "had", "not", "no", "yes", "true", "false", "real", "fake"
]);

function keyTerms(text: string): string[] {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function normalize(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function looksLikeProperNounTitle(title: string, claimText: string): boolean {
  const titleWords = title.split(/\s+/).filter(Boolean);
  const isMultiWordCapitalized = titleWords.length >= 2 && titleWords.every((w) => /^[A-Z]/.test(w) || ["the", "of", "and", "a"].includes(w.toLowerCase()));
  if (!isMultiWordCapitalized) return false;
  const mainTerm = titleWords.find((w) => !["the", "of", "and", "a"].includes(w.toLowerCase())) ?? "";
  const appearsCapitalizedInClaim = new RegExp(`\\b${mainTerm}\\b`).test(claimText);
  return !appearsCapitalizedInClaim;
}

function relevanceScore(claimText: string, articleTitle: string, articleExtract: string): number {
  const claimTerms = new Set(keyTerms(claimText).map(normalize));
  if (!claimTerms.size) return 0;
  const articleTerms = new Set([...keyTerms(articleTitle), ...keyTerms(articleExtract)].map(normalize));
  let overlap = 0;
  for (const term of claimTerms) {
    if (articleTerms.has(term)) overlap += 1;
  }
  return overlap / claimTerms.size;
}

const MIN_RELEVANCE = 0.4;
const MIN_KEYWORDS = 2;

export async function lookupWikipedia(claimText: string): Promise<WikiReference> {
  const terms = keyTerms(claimText);
  if (terms.length < MIN_KEYWORDS) return { found: false };
  const subject = terms.slice(0, 5).join(" ");

  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(subject)}&format=json&srlimit=3`,
      { headers: { "user-agent": "Sleuth/1.0 (evidence-checking tool)" } }
    );
    if (!searchRes.ok) return { found: false };
    const searchData = await searchRes.json();
    const hits: { title: string }[] = searchData?.query?.search ?? [];
    if (!hits.length) return { found: false };

    for (const hit of hits) {
      if (!hit?.title) continue;
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`, {
        headers: { "user-agent": "Sleuth/1.0 (evidence-checking tool)" }
      });
      if (!summaryRes.ok) continue;
      const summary = await summaryRes.json();
      if (!summary.extract) continue;
      if (summary.description && /disambiguation/i.test(summary.description)) continue;

      const title = summary.title ?? hit.title;
      if (looksLikeProperNounTitle(title, claimText)) continue;

      const score = relevanceScore(claimText, title, summary.extract);
      const matchedTermCount = Math.round(score * keyTerms(claimText).length);
      if (score < MIN_RELEVANCE || matchedTermCount < MIN_KEYWORDS) continue;

      return {
        found: true,
        title,
        extract: summary.extract.slice(0, 500),
        url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title)}`
      };
    }
    return { found: false };
  } catch {
    return { found: false };
  }
}
