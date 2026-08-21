import type { TruthCase } from "@/types/investigation";

const now = "2026-08-10T10:10:00.000Z";

export const demoCase: TruthCase = {
  id: "demo-medical-article",
  title: "Is this medical article trustworthy?",
  question: "Is this article actually telling the truth about the new survival treatment?",
  inputType: "url",
  input: "https://example.demo/health/survival-treatment-claim",
  mode: "demo",
  status: "complete",
  verdict: "partially-supported",
  confidence: 64,
  summary:
    "The publication appears legitimate and the cited study exists, but the article overstates the primary result. Several background claims are supported, one central numerical claim is exaggerated, and two claims need stronger independent evidence.",
  createdAt: "2026-08-10T10:02:00.000Z",
  updatedAt: now,
  trustProfile: {
    sourceAuthority: 82,
    evidenceQuality: 91,
    claimSupport: 64,
    transparency: 51,
    independentSupport: 77,
    contradictions: 3,
    syntheticSignals: "moderate",
    conclusion:
      "Legitimate source, mixed claim accuracy. The strongest issue is an exaggerated treatment-effect claim that is not supported by the cited study."
  },
  synthetic: {
    signals: [
      { key: "language-pattern", label: "Language pattern anomalies", status: "low", detail: "No heavily formulaic phrasing found. Stock phrases are used but not pervasive." },
      { key: "repetitive-structure", label: "Repetitive structure", status: "moderate", detail: "Paragraph rhythm is uniform across sections, common in press-style editing." },
      { key: "burstiness", label: "Text rhythm (burstiness)", status: "low", detail: "Sentence-length variance is unremarkable." },
      { key: "punctuation-density", label: "Punctuation & emphasis", status: "moderate", detail: "Elevated emphasis punctuation in the headline section, typical of online health media." },
      { key: "lexical-diversity", label: "Lexical diversity", status: "low", detail: "Vocabulary ratio is normal for journalism." },
      { key: "provenance", label: "Source originality", status: "unknown", detail: "No provenance check in demo corpus." }
    ],
    interpretation: "1 moderate-signal flagged. These are heuristic content signals, NOT proof of AI generation. The substantive issue is the overstated headline figure, not the writing style.",
    overallScore: 22,
    label: "mixed signals"
  },
  skeptic: {
    findings: [
      { kind: "alternative", label: "Alternative endpoint framing", detail: "The 40% figure may combine secondary endpoints; the primary endpoint reports 18%." },
      { kind: "conflict", label: "Direct numeric conflict", detail: "Headline 40% conflicts with the 18% primary result in the same evidence set." },
      { kind: "assumption", label: "Scope assumption", detail: "\"Recommended by clinicians\" applies only to a narrow eligible patient group." }
    ],
    confidenceBefore: 78,
    confidenceAfter: 64,
    note: "The skeptic phase attempted to disprove the conclusion: 3 counter-evidence findings were identified and confidence was adjusted downward."
  },
  sourceError: undefined,
  fetchedTitle: "New survival treatment: does it live up to the promise?",
  sourceProfile: {
    publisher: "Example Health Review",
    url: "https://example.demo",
    authority: 82,
    transparency: 51,
    independentCorroboration: 79,
    knownConflicts: 2,
    history: [
      "Publishes named editorial staff and correction policy.",
      "Medical articles often cite primary studies, but summaries sometimes compress uncertainty.",
      "Two disclosed advertising relationships with supplement brands."
    ],
    verificationChecks: [
      { label: "Domain reputation", status: "pass", detail: "Demo domain treated as an established health media outlet for illustration purposes." },
      { label: "HTTPS / transport security", status: "pass", detail: "Site is served over HTTPS." },
      { label: "Publisher transparency (about/contact)", status: "pass", detail: "Named editorial staff and correction policy disclosed." },
      { label: "Privacy policy present", status: "pass", detail: "Privacy policy present." },
      { label: "Byline / authorship", status: "pass", detail: "Named authors on articles." },
      { label: "Publish date present", status: "pass", detail: "Publish date shown." },
      { label: "Cites outside sources", status: "warn", detail: "Cites the primary study but compresses uncertainty in the summary." }
    ],
    domainScore: 78
  },
  claims: [
    {
      id: "claim-1",
      caseId: "demo-medical-article",
      text: "The treatment increases survival by 40%.",
      status: "exaggerated",
      confidence: 94,
      sourceClaim: "Article headline and second paragraph state a 40% survival increase.",
      primarySource: "Trial report shows an 18% relative improvement in the measured endpoint.",
      independentSources: ["Clinical Registry mirror → endpoint differs from article", "Journal editorial → benefit described as modest"],
      verdict: "The article significantly exaggerates the measured result.",
      receipts: [
        { id: "r1", label: "Study exists", detail: "The cited trial exists and measures survival-related outcomes.", strength: "high" },
        { id: "r2", label: "Reported result", detail: "Primary result is 18%, not 40%, for the relevant endpoint.", strength: "high" },
        { id: "r3", label: "Interpretation gap", detail: "The article appears to combine secondary endpoints into a stronger headline claim.", strength: "medium" }
      ]
    },
    {
      id: "claim-2",
      caseId: "demo-medical-article",
      text: "The study enrolled 842 participants across multiple hospitals.",
      status: "supported",
      confidence: 91,
      sourceClaim: "Article says the trial included 842 participants.",
      primarySource: "Trial methods section lists 842 randomized participants at 11 hospitals.",
      independentSources: ["Registry entry confirms enrollment", "Editorial summary repeats 842 participants"],
      verdict: "This factual description matches the primary source.",
      receipts: [
        { id: "r4", label: "Methods match", detail: "The trial methods section and article agree on sample size.", strength: "high" },
        { id: "r5", label: "Independent confirmation", detail: "Clinical registry and editorial corroborate the participant count.", strength: "high" }
      ]
    },
    {
      id: "claim-3",
      caseId: "demo-medical-article",
      text: "Side effects were rare and mostly mild.",
      status: "uncertain",
      confidence: 58,
      sourceClaim: "Article describes side effects as rare.",
      primarySource: "Trial adverse-event table shows mild events were common but serious events were uncommon.",
      independentSources: ["Patient follow-up window was short", "No large post-market surveillance found in demo corpus"],
      verdict: "The claim compresses important context. Serious events were uncommon, but mild side effects were not rare.",
      receipts: [
        { id: "r6", label: "Terminology issue", detail: "The article does not distinguish mild, moderate, and serious event rates.", strength: "medium" },
        { id: "r7", label: "Evidence gap", detail: "Long-term safety data is not established in the available evidence.", strength: "medium" }
      ]
    },
    {
      id: "claim-4",
      caseId: "demo-medical-article",
      text: "The treatment has already been recommended by independent clinicians.",
      status: "supported",
      confidence: 76,
      sourceClaim: "Article cites a clinician panel.",
      primarySource: "Panel statement recommends consideration for a narrow patient group.",
      independentSources: ["Hospital protocol draft mentions the treatment", "Specialist commentary supports limited use"],
      verdict: "Supported with a narrower scope than the article implies.",
      receipts: [
        { id: "r8", label: "Panel found", detail: "The cited independent panel statement exists.", strength: "high" },
        { id: "r9", label: "Scope limitation", detail: "Recommendation applies only to a subset of eligible patients.", strength: "medium" }
      ]
    }
  ],
  evidence: [
    { id: "source-main", caseId: "demo-medical-article", title: "Example Health Review article", kind: "source", excerpt: "Claims a major survival increase from a new treatment.", quality: 62, stance: "context" },
    { id: "study-primary", caseId: "demo-medical-article", title: "Primary clinical trial", kind: "study", excerpt: "842 participants; 18% relative improvement on the measured endpoint.", quality: 94, stance: "supports" },
    { id: "registry", caseId: "demo-medical-article", title: "Clinical registry entry", kind: "document", excerpt: "Confirms enrollment and endpoint definitions.", quality: 88, stance: "supports" },
    { id: "editorial", caseId: "demo-medical-article", title: "Journal editorial", kind: "analysis", excerpt: "Describes benefits as modest and warns against headline overstatement.", quality: 86, stance: "contradicts" },
    { id: "safety-table", caseId: "demo-medical-article", title: "Adverse events table", kind: "metric", excerpt: "Mild side effects common; serious side effects uncommon.", quality: 89, stance: "neutral" },
    { id: "panel", caseId: "demo-medical-article", title: "Independent clinician panel", kind: "statement", excerpt: "Recommends consideration for a narrow patient group.", quality: 78, stance: "supports" }
  ],
  relationships: [
    { id: "rel-1", caseId: "demo-medical-article", fromId: "source-main", toId: "claim-1", type: "cites", rationale: "Article introduces the 40% claim." },
    { id: "rel-2", caseId: "demo-medical-article", fromId: "study-primary", toId: "claim-1", type: "contradicts", rationale: "Primary result is materially lower than the article's figure." },
    { id: "rel-3", caseId: "demo-medical-article", fromId: "registry", toId: "claim-2", type: "supports", rationale: "Registry confirms enrollment." },
    { id: "rel-4", caseId: "demo-medical-article", fromId: "editorial", toId: "claim-1", type: "disputes", rationale: "Editorial criticizes overstatement." },
    { id: "rel-5", caseId: "demo-medical-article", fromId: "safety-table", toId: "claim-3", type: "related_to", rationale: "Adds nuance to the side-effect claim." },
    { id: "rel-6", caseId: "demo-medical-article", fromId: "panel", toId: "claim-4", type: "supports", rationale: "Panel statement supports limited recommendation." }
  ],
  timeline: [
    { id: "t1", label: "Case created", detail: "Demo URL added to investigation workspace.", status: "complete", at: "10:02" },
    { id: "t2", label: "URL analyzed", detail: "Source, headline, cited study, and article claims parsed.", status: "complete", at: "10:03" },
    { id: "t3", label: "Claims extracted", detail: "4 representative claims shown from 14 detected in the full article.", status: "complete", at: "10:04" },
    { id: "t4", label: "External sources discovered", detail: "Registry, editorial, trial report, and clinician panel linked.", status: "complete", at: "10:05" },
    { id: "t5", label: "Contradiction detected", detail: "40% claim conflicts with the 18% primary study result.", status: "warning", at: "10:07" },
    { id: "t6", label: "Skeptic check complete", detail: "Confidence adjusted from 78 to 64 after counter-evidence review.", status: "complete", at: "10:09" }
  ],
  actions: [
    { id: "a1", caseId: "demo-medical-article", label: "Generate response", description: "Draft a concise note challenging the exaggerated claim.", output: "The cited study appears real, but it reports an 18% endpoint improvement rather than the 40% survival increase stated in the article. Please clarify the calculation and endpoint used for the headline." },
    { id: "a2", caseId: "demo-medical-article", label: "Create report", description: "Compile a printable evidence report with receipts." },
    { id: "a3", caseId: "demo-medical-article", label: "Monitor this claim", description: "Watch for new clinical guidance or corrected article language." }
  ],
  reports: [],
  watches: [
    { id: "w1", caseId: "demo-medical-article", target: "Treatment survival claim and article corrections", cadence: "manual", status: "active", latestDevelopment: "No new development. Manual check ready." }
  ]
};
