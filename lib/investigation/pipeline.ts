import type {
  CreateCaseInput,
  InvestigationStep,
  PipelineEvent,
  TruthCase
} from "@/types/investigation";
import { saveCase } from "@/lib/database/repository";
import { generateActions } from "@/lib/actions/generator";
import { generateReport } from "@/lib/reports/generator";
import { fetchSourceText } from "@/lib/web/fetch-source";
import { extractYoutubeVideoId, fetchYoutubeTranscript } from "@/lib/web/youtube-transcript";
import { extractClaims, detectInputType } from "./claims";
import { buildEvidence, buildRelationships } from "./evidence";
import { runSkepticCheck } from "./skeptic";
import { analyzeSyntheticSignals } from "./synthetic";
import { buildSourceProfile } from "./source-profile";
import { buildTrustProfile } from "./trust";
import { computeVerdict, verdictSummary } from "./verdict";
import { detectScenario, getScenarioGuidance } from "./scenario";
import { verifyClaimsWithAI, aiVerificationConfigured } from "@/lib/verify/anthropic";
import { verifyClaimsWithGemini, geminiConfigured } from "@/lib/verify/gemini";
import { lookupWikipedia } from "@/lib/verify/wikipedia";
import { detectNonLatinScript } from "./language";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function id() {
  return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function at() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function titleFrom(input: CreateCaseInput, fetchedTitle?: string) {
  if (input.question.trim()) return input.question.trim().slice(0, 90);
  if (/^https?:\/\//i.test(input.input)) {
    try {
      const host = new URL(input.input).hostname;
      return fetchedTitle ? `Investigation: ${fetchedTitle.slice(0, 60)}` : `Investigation: ${host}`;
    } catch {
      return `Investigation: ${input.input.slice(0, 80)}`;
    }
  }
  return input.input.trim().slice(0, 90) || "Untitled investigation";
}

export async function* runInvestigationPipeline(
  input: CreateCaseInput,
  opts: { persist?: boolean; userId?: string } = {}
): AsyncGenerator<PipelineEvent, TruthCase, undefined> {
  const caseId = id();
  const createdAt = new Date().toISOString();
  const displayQuestion = input.question.trim() || "What should I trust here?";
  const timeline: InvestigationStep[] = [
    { id: "step-created", label: "Case created", detail: "Investigation workspace and persistent case record created.", status: "complete", at: at() }
  ];

  yield { type: "step", stepId: "step-created", label: "Case created", status: "complete", detail: "Investigation workspace and persistent case record created." };
  await delay(140);

  yield { type: "step", stepId: "step-ingest", label: "Reading source", status: "active", detail: "Treating submitted material as untrusted input." };
  await delay(240);

  const isUrl = /^https?:\/\//i.test(input.input.trim());
  let analysisText = input.input.trim();
  let fetchOk = !isUrl;
  let fetchedTitle: string | undefined;
  let sourceError: string | undefined;
  let fetchResult: Awaited<ReturnType<typeof fetchSourceText>> | undefined;
  const youtubeVideoId = isUrl ? extractYoutubeVideoId(input.input.trim()) : null;
  const isTiktok = isUrl && /(^|\.)tiktok\.com$/i.test((() => { try { return new URL(input.input.trim()).hostname.replace(/^www\./, ""); } catch { return ""; } })());

  if (isTiktok) {
    fetchOk = false;
    sourceError = "TikTok videos can't be read yet — there's no free way to pull captions or transcripts from TikTok. Try pasting the video's caption text or description instead.";
    yield { type: "step", stepId: "step-ingest", label: "TikTok not supported", status: "warning", detail: sourceError };
    await delay(160);
  } else if (youtubeVideoId) {
    yield { type: "step", stepId: "step-ingest", label: "Reading video captions", status: "active", detail: "Looking for a transcript on this YouTube video." };
    const yt = await fetchYoutubeTranscript(input.input.trim());
    fetchOk = yt.ok;
    if (!yt.ok) {
      sourceError = yt.reason ?? "Couldn't read this video's captions.";
      yield { type: "step", stepId: "step-ingest", label: "No transcript available", status: "warning", detail: sourceError };
    } else {
      analysisText = yt.transcript ?? "";
      fetchedTitle = yt.title ? `${yt.title}${yt.channel ? ` — ${yt.channel}` : ""}` : undefined;
      yield { type: "step", stepId: "step-ingest", label: "Transcript read", status: "complete", detail: `Read the caption transcript${fetchedTitle ? ` for "${fetchedTitle}"` : ""}.` };
    }
  } else if (isUrl) {
    const fetched = await fetchSourceText(input.input.trim());
    fetchResult = fetched;
    fetchOk = fetched.ok;
    if (!fetched.ok) {
      sourceError = fetched.reason ?? "Source fetch failed";
      yield { type: "step", stepId: "step-ingest", label: "Source unavailable", status: "warning", detail: `Could not fetch the URL: ${sourceError}.` };
    } else {
      analysisText = fetched.text;
      fetchedTitle = fetched.title;
      yield { type: "step", stepId: "step-ingest", label: "Source read", status: "complete", detail: `Fetched ${analysisText.split(/\s+/).length} words${fetchedTitle ? ` — "${fetchedTitle}"` : ""}.` };
    }
  } else {
    yield { type: "step", stepId: "step-ingest", label: "Source read", status: "complete", detail: `Pasted material received (${analysisText.split(/\s+/).length} words).` };
  }
  await delay(160);

  yield { type: "step", stepId: "step-claims", label: "Extracting claims", status: "active", detail: "Breaking content into individual reviewable claims." };
  await delay(420);
  const claims = fetchOk ? extractClaims({ question: input.question, input: analysisText }, caseId) : [];
  yield { type: "step", stepId: "step-claims", label: "Claims extracted", status: "complete", detail: `${claims.length} claim(s) isolated for claim-level analysis.` };

  yield { type: "step", stepId: "step-evidence", label: "Mapping evidence", status: "active", detail: "Linking source, fetched content, and analysis nodes." };
  await delay(320);
  const evidence = buildEvidence({ caseId, input: input.input, analysisText, fetchOk, fetchedTitle, fetchedUrl: isUrl ? input.input.trim() : undefined, claims });
  const relationships = buildRelationships(caseId, claims, evidence);
  const contradictionCount = claims.filter((c) => c.status === "contradicted" || c.status === "exaggerated").length;
  yield { type: "step", stepId: "step-evidence", label: "Evidence mapped", status: "complete", detail: `${evidence.length} evidence node(s), ${relationships.length} relationship(s).` };
  yield { type: "counts", claims: claims.length, evidence: evidence.length, contradictions: contradictionCount };
  await delay(220);

  yield { type: "step", stepId: "step-skeptic", label: "Running skeptic check", status: "active", detail: "Attempting to disprove the current conclusion." };
  await delay(520);
  const skeptic = runSkepticCheck(claims, evidence);
  const skepticClaims = skeptic.claims;
  yield { type: "step", stepId: "step-skeptic", label: "Skeptic check complete", status: skeptic.report.findings.length ? "warning" : "complete", detail: `${skeptic.report.findings.length} counter-evidence finding(s); confidence ${skeptic.report.confidenceBefore} → ${skeptic.report.confidenceAfter}.` };
  yield { type: "skeptic", confidenceBefore: skeptic.report.confidenceBefore, confidenceAfter: skeptic.report.confidenceAfter };

  yield { type: "step", stepId: "step-synthetic", label: "Scanning synthetic signals", status: "active", detail: "Heuristic content signals only; never reported as proof of AI generation." };
  await delay(380);
  const synthetic = analyzeSyntheticSignals(analysisText);
  const profile = buildTrustProfile(
    skepticClaims,
    evidence,
    contradictionCount,
    isUrl,
    fetchOk,
    synthetic.signals.some((s) => s.status === "detected") ? "detected" : synthetic.signals.some((s) => s.status === "moderate") ? "moderate" : "low"
  );
  const sourceProfile = buildSourceProfile({ input, fetchOk, fetchedTitle, fetchResult });
  yield { type: "step", stepId: "step-synthetic", label: "Signals assessed", status: "complete", detail: `Trust profile generated; ${synthetic.signals.filter((s) => s.status === "detected").length} strong heuristic signal(s).` };

  const scenarioKind = detectScenario(`${input.question} ${input.input}`);
  const scenarioGuidance = getScenarioGuidance(scenarioKind);
  if (scenarioKind !== "general") {
    yield { type: "step", stepId: "step-scenario", label: "Scenario matched", status: "complete", detail: `Recognized as: ${scenarioGuidance.label}.` };
  }

  let aiVerification: TruthCase["aiVerification"] = { ran: false, ok: false };
  let aiOverallSummary: string | undefined;
  let aiCitations: TruthCase["aiCitations"] = undefined;

  if (geminiConfigured() && skepticClaims.length > 0) {
    yield { type: "step", stepId: "step-ai-verify", label: "Checking claims with Gemini", status: "active", detail: "Searching the web and reasoning about each claim." };
    const result = await verifyClaimsWithGemini({ question: input.question, sourceContext: analysisText, claims: skepticClaims });
    aiVerification = { ran: true, ok: result.ok, error: result.error, model: result.rawModel };
    if (result.ok) {
      aiOverallSummary = result.overallSummary;
      aiCitations = result.overallCitations;
      for (const verified of result.verifiedClaims) {
        const target = skepticClaims.find((c) => c.id === verified.claimId);
        if (!target) continue;
        target.status = verified.status;
        target.confidence = verified.confidence;
        target.verdict = verified.verdict;
        target.aiVerified = true;
        target.citations = verified.citations;
      }
      yield {
        type: "step",
        stepId: "step-ai-verify",
        label: result.grounded ? "Gemini search complete" : "Gemini check complete (no live search)",
        status: "complete",
        detail: result.grounded ? "Answered using live web search results." : "Answered from the model's own knowledge; live search was unavailable this time."
      };
    } else {
      yield { type: "step", stepId: "step-ai-verify", label: "Gemini check skipped", status: "warning", detail: result.error ?? "Gemini call failed; falling back to local analysis only." };
    }
  } else if (aiVerificationConfigured() && skepticClaims.length > 0) {
    yield { type: "step", stepId: "step-ai-verify", label: "Verifying claims against live web sources", status: "active", detail: "Calling Claude with web search to independently check each claim." };
    const result = await verifyClaimsWithAI({ question: input.question, sourceContext: analysisText, claims: skepticClaims });
    aiVerification = { ran: true, ok: result.ok, error: result.error, model: result.rawModel };
    if (result.ok) {
      for (const verified of result.verifiedClaims) {
        const target = skepticClaims.find((c) => c.id === verified.claimId);
        if (!target) continue;
        target.status = verified.status;
        target.confidence = verified.confidence;
        target.verdict = verified.verdict;
        target.aiVerified = true;
        target.citations = verified.citations;
      }
      yield { type: "step", stepId: "step-ai-verify", label: "AI verification complete", status: "complete", detail: `${result.verifiedClaims.length} claim(s) checked against live web sources.` };
    } else {
      yield { type: "step", stepId: "step-ai-verify", label: "AI verification skipped", status: "warning", detail: result.error ?? "Verification call failed; falling back to local analysis only." };
    }
  }

  let reference: TruthCase["reference"] = undefined;
  if (!aiVerification.ok && skepticClaims.length > 0) {
    yield { type: "step", stepId: "step-reference", label: "Looking for a relevant reference", status: "active", detail: "Checking Wikipedia for a related article (free, no API key needed)." };
    try {
      reference = await lookupWikipedia(skepticClaims[0].text);
    } catch {
      reference = { found: false };
    }
    yield {
      type: "step",
      stepId: "step-reference",
      label: reference.found ? "Reference found" : "No reference found",
      status: "complete",
      detail: reference.found ? `Found a related Wikipedia article: ${reference.title}.` : "No closely related Wikipedia article was found."
    };
  }

  const scriptCheck = detectNonLatinScript(input.input + " " + input.question);
  const languageNote =
    scriptCheck.isNonLatin && !aiVerification.ok
      ? `Your text looks like it's written in ${scriptCheck.scriptName}. Basic mode reads it as-is but can't reply in that language yet — this answer is in English. Enhanced mode replies in your language.`
      : undefined;

  yield { type: "step", stepId: "step-verdict", label: "Preparing verdict", status: "active", detail: "Reconciling claims, receipts, and counter-evidence." };
  await delay(360);
  const baseConfidence = skepticClaims.length
    ? Math.round(skepticClaims.reduce((sum, c) => sum + c.confidence, 0) / skepticClaims.length)
    : 30;
  const { verdict, confidence } = computeVerdict(skepticClaims, baseConfidence);

  const caseRecord: TruthCase = {
    id: caseId,
    title: titleFrom(input, fetchedTitle),
    question: displayQuestion,
    input: input.input,
    inputType: input.inputType ?? detectInputType(input.input),
    mode: aiVerification.ran && aiVerification.ok ? (geminiConfigured() ? "live-gemini" : "live-anthropic") : "live-local",
    status: fetchOk ? "complete" : "error",
    verdict,
    confidence,
    summary: aiOverallSummary ?? verdictSummary({ verdict, trustProfile: profile, claims: skepticClaims }),
    createdAt,
    updatedAt: new Date().toISOString(),
    trustProfile: profile,
    sourceProfile,
    synthetic,
    skeptic: skeptic.report,
    sourceError,
    fetchedTitle,
    scenario: scenarioKind !== "general" ? scenarioGuidance : undefined,
    aiVerification,
    aiCitations,
    reference,
    languageNote,
    claims: skepticClaims,
    evidence,
    relationships,
    timeline: [
      ...timeline,
      { id: "step-ingest", label: "Source ingested", detail: sourceError ? "URL fetch failed; case preserved for retry." : "Submitted material treated as untrusted input and prepared for analysis.", status: sourceError ? "warning" : "complete", at: at() },
      { id: "step-claims", label: "Claims extracted", detail: `${skepticClaims.length} claim(s) identified.`, status: "complete", at: at() },
      { id: "step-evidence", label: "Evidence graph updated", detail: `${evidence.length} evidence nodes connected.`, status: "complete", at: at() },
      ...skeptic.steps,
      { id: "step-synthetic", label: "Trust profile built", detail: `Source authority ${profile.sourceAuthority}, claim support ${profile.claimSupport}.`, status: "complete", at: at() },
      { id: "step-verdict", label: "Verdict generated", detail: `${verdict.toUpperCase()} at ${confidence}% confidence.`, status: "complete", at: at() }
    ],
    actions: [],
    reports: [],
    watches: [
      { id: `watch-${caseId}`, caseId, target: titleFrom(input, fetchedTitle), cadence: "manual", status: "active", latestDevelopment: "Watch created. Manual refresh available; scheduled jobs can be connected later." }
    ]
  };
  caseRecord.actions = generateActions(caseRecord);
  caseRecord.reports = [generateReport(caseRecord)];

  yield { type: "verdict", verdict, confidence };
  yield { type: "step", stepId: "step-verdict", label: "Verdict ready", status: "complete", detail: `${verdict.toUpperCase()} — ${confidence}% confidence. Report and next actions prepared.` };

  if ((opts.persist ?? true) && opts.userId) await saveCase(caseRecord, opts.userId);
  yield { type: "done", caseId };
  return caseRecord;
}

export async function createInvestigation(input: CreateCaseInput, userId: string): Promise<TruthCase> {
  const generator = runInvestigationPipeline(input, { userId });
  let result: IteratorResult<PipelineEvent, TruthCase>;
  do {
    result = await generator.next();
  } while (!result.done);
  return result.value;
}
