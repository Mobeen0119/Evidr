import type { SyntheticReport, SyntheticSignal } from "@/types/investigation";

const formulaic = [
  "in today's fast-paced", "in a world where", "it is important to note that", "delve into", "in conclusion",
  "furthermore", "moreover", "it is worth noting", "unlock the", "game-changer", "revolutionary",
  "seamlessly", "elevate your", "unleash", "harness the power", "at the end of the day", "without further ado",
  "let that sink in", "remains a pressing", "it cannot be overstated", "the bottom line is",
  "navigating the", "in the realm of", "plays a crucial role", "underscores the importance",
  "when it comes to", "it's worth mentioning", "as an ai language model", "i cannot provide",
  "i don't have access to real-time", "overall, it is clear that", "it's important to remember",
  "that being said", "with that said", "in summary", "to summarize", "let's break this down",
  "here's the thing", "here's why", "the key takeaway", "on the other hand", "not only", "but also",
  "it's not just about", "it's also about", "whether you're", "ultimately", "in essence"
];

const transitionWords = ["additionally", "furthermore", "moreover", "however", "therefore", "consequently", "thus", "in addition", "on the other hand", "as a result", "that said", "meanwhile"];

function scoreLevel(score: number): "detected" | "moderate" | "low" {
  return score > 0.66 ? "detected" : score > 0.33 ? "moderate" : "low";
}

function levelWeight(status: SyntheticSignal["status"]) {
  if (status === "detected") return 1;
  if (status === "moderate") return 0.5;
  return 0;
}

export function analyzeSyntheticSignals(text: string): SyntheticReport {
  const signals: SyntheticSignal[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const lowerText = text.toLowerCase();

  const formulaicHits = formulaic.filter((phrase) => lowerText.includes(phrase));
  const uniqueWords = new Set(words);
  const typeTokenRatio = uniqueWords.size / Math.max(words.length, 1);
  const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(sentenceLengths.length, 1);
  const variance = sentenceLengths.length ? sentenceLengths.reduce((a, b) => a + (b - mean) ** 2, 0) / sentenceLengths.length : 0;
  const burstiness = Math.sqrt(variance) / Math.max(mean, 1);
  const emDashes = (text.match(/—|–/g) ?? []).length;
  const emDashDensity = emDashes / Math.max(sentences.length, 1);
  const exclamations = (text.match(/!/g) ?? []).length;
  const sentenceStarters = new Set(sentences.map((s) => s.split(/\s+/)[0]?.toLowerCase() ?? ""));
  const repeatedStarts = sentenceStarters.size / Math.max(sentences.length, 1);
  const transitionHits = transitionWords.filter((w) => lowerText.includes(w));
  const transitionDensity = transitionHits.length / Math.max(sentences.length, 1);
  const boldMarkers = (text.match(/\*\*[^*]+\*\*/g) ?? []).length;
  const bulletLines = (text.match(/^\s*[-*•]\s+/gm) ?? []).length;
  const numberedLines = (text.match(/^\s*\d+\.\s+/gm) ?? []).length;
  const structureScore = Math.min(1, (boldMarkers + bulletLines * 1.5 + numberedLines * 1.5) / Math.max(sentences.length * 0.4, 4));

  signals.push({
    key: "language-pattern",
    label: "Language pattern anomalies",
    status: scoreLevel(formulaicHits.length / 3),
    detail: `${formulaicHits.length} formulaic AI-flavored phrase(s) found (e.g. ${formulaicHits.slice(0, 3).map((p) => `"${p.trim()}"`).join(", ") || "none"}). Formulaic phrasing alone is weak evidence of AI generation; human journalism also uses stock phrases.`
  });

  signals.push({
    key: "repetitive-structure",
    label: "Repetitive structure",
    status: scoreLevel(1 - repeatedStarts),
    detail: `Sentence starts repeat heavily (unique-start ratio ${(repeatedStarts * 100).toFixed(0)}%). Uniform rhythm is one signal, not proof of AI authorship.`
  });

  signals.push({
    key: "burstiness",
    label: "Text rhythm (burstiness)",
    status: scoreLevel(1 - Math.min(burstiness, 1)),
    detail: `Sentence-length variance is ${burstiness < 0.35 ? "very low — sentences are unusually uniform in length" : burstiness > 0.7 ? "high, more typical of human writing" : "moderate"}. Common in generated text, but also in dense policy or reference writing.`
  });

  signals.push({
    key: "punctuation-density",
    label: "Punctuation & emphasis",
    status: scoreLevel(Math.min(1, emDashDensity * 1.8 + Math.min(exclamations, 6) / 12)),
    detail: `${emDashes} em/en-dash marks and ${exclamations} exclamation points across ${sentences.length} sentences. Heavy em-dash use in particular is a common tic in current AI writing, but some human writers use it too.`
  });

  signals.push({
    key: "lexical-diversity",
    label: "Lexical diversity",
    status: scoreLevel(1 - Math.min(typeTokenRatio / 0.4, 1)),
    detail: `Vocabulary type-token ratio ${(typeTokenRatio * 100).toFixed(0)}%. Low diversity over a long passage can indicate repetitive, templated writing.`
  });

  signals.push({
    key: "transition-density",
    label: "Transition-word density",
    status: scoreLevel(transitionDensity * 1.6),
    detail: `${transitionHits.length} formal transition word(s) across ${sentences.length} sentence(s). Heavy, evenly-spaced transitions ("furthermore", "moreover", "that said") are common in AI-generated explainer prose.`
  });

  signals.push({
    key: "structure-uniformity",
    label: "Heavy formatting structure",
    status: scoreLevel(structureScore),
    detail: `${boldMarkers} bold marker(s), ${bulletLines} bullet line(s), ${numberedLines} numbered line(s). Long, evenly-structured lists and bolded phrases are a strong stylistic habit of chat-assistant output, though many humans now write this way too after using these tools.`
  });

  signals.push({
    key: "provenance",
    label: "Source originality",
    status: "unknown",
    detail: "No external provenance check is available in local mode. Originality requires cross-source and metadata analysis."
  });

  const weighable = signals.filter((s) => s.status !== "unknown");
  const rawScore = weighable.reduce((sum, s) => sum + levelWeight(s.status), 0) / Math.max(weighable.length, 1);
  const overallScore = Math.round(rawScore * 100);

  const label: SyntheticReport["label"] =
    overallScore >= 65 ? "likely AI-generated" : overallScore >= 42 ? "likely AI-assisted" : overallScore >= 20 ? "mixed signals" : "likely human";

  const positive = signals.filter((s) => s.status === "detected").length;
  const moderate = signals.filter((s) => s.status === "moderate").length;

  return {
    signals,
    overallScore,
    label,
    interpretation: `${positive} signal(s) flagged, ${moderate} moderate. Composite score ${overallScore}/100 ("${label}"). This is a heuristic estimate from writing-pattern signals only — it is NOT a forensic AI-detection result, cannot prove authorship, and should never be the sole basis for a trust decision. Even the best commercial AI detectors get this wrong regularly. Evaluate the underlying claims and sourcing first.`
  };
}
