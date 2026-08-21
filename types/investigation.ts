export type ClaimStatus = "supported" | "uncertain" | "contradicted" | "exaggerated";
export type EvidenceKind = "source" | "document" | "study" | "policy" | "statement" | "metric" | "analysis";
export type RelationshipType = "supports" | "contradicts" | "cites" | "derived_from" | "related_to" | "verifies" | "disputes";
export type InvestigationMode = "demo" | "live-local" | "live-backboard" | "live-anthropic" | "live-gemini";
export type VerdictStatus = "supported" | "partially-supported" | "uncertain" | "contradicted" | "insufficient-evidence";

export interface TrustProfile {
  sourceAuthority: number;
  evidenceQuality: number;
  claimSupport: number;
  transparency: number;
  independentSupport: number;
  contradictions: number;
  syntheticSignals: "none" | "low" | "moderate" | "detected";
  conclusion: string;
}

export interface VerificationCheck {
  label: string;
  status: "pass" | "warn" | "fail" | "unknown";
  detail: string;
}

export interface SourceProfile {
  publisher: string;
  url?: string;
  authority: number;
  transparency: number;
  independentCorroboration: number;
  knownConflicts: number;
  history: string[];
  verificationChecks: VerificationCheck[];
  domainScore?: number;
}

export interface Receipt {
  id: string;
  label: string;
  detail: string;
  strength: "low" | "medium" | "high";
}

export interface Claim {
  id: string;
  caseId: string;
  text: string;
  status: ClaimStatus;
  confidence: number;
  sourceClaim: string;
  primarySource?: string;
  independentSources: string[];
  verdict: string;
  receipts: Receipt[];
  aiVerified?: boolean;
  flagged?: boolean;
  citations?: { title: string; url: string; note: string }[];
}

export interface Evidence {
  id: string;
  caseId: string;
  title: string;
  kind: EvidenceKind;
  excerpt: string;
  url?: string;
  quality: number;
  stance: "supports" | "contradicts" | "neutral" | "context";
}

export interface EvidenceRelationship {
  id: string;
  caseId: string;
  fromId: string;
  toId: string;
  type: RelationshipType;
  rationale: string;
}

export interface InvestigationStep {
  id: string;
  label: string;
  detail: string;
  status: "complete" | "active" | "queued" | "warning" | "error";
  at: string;
}

export interface SyntheticSignal {
  key: string;
  label: string;
  status: "detected" | "moderate" | "low" | "unknown";
  detail: string;
}

export interface SyntheticReport {
  signals: SyntheticSignal[];
  interpretation: string;
  overallScore: number;
  label: "likely human" | "mixed signals" | "likely AI-assisted" | "likely AI-generated";
}

export interface SkepticFinding {
  kind: "alternative" | "conflict" | "assumption";
  label: string;
  detail: string;
  claimId?: string;
}

export interface SkepticReport {
  findings: SkepticFinding[];
  confidenceBefore: number;
  confidenceAfter: number;
  note: string;
}

export interface CaseAction {
  id: string;
  caseId: string;
  label: string;
  description: string;
  output?: string;
}

export interface Report {
  id: string;
  caseId: string;
  title: string;
  markdown: string;
  createdAt: string;
}

export interface Watch {
  id: string;
  caseId: string;
  target: string;
  cadence: "manual" | "daily" | "weekly";
  lastChecked?: string;
  status: "active" | "paused";
  latestDevelopment?: string;
}

export interface TruthCase {
  id: string;
  title: string;
  question: string;
  inputType: "url" | "text" | "document" | "image" | "multi" | "problem";
  input: string;
  mode: InvestigationMode;
  status: "draft" | "investigating" | "complete" | "error";
  verdict: VerdictStatus;
  confidence: number;
  summary: string;
  createdAt: string;
  updatedAt: string;
  trustProfile: TrustProfile;
  sourceProfile?: SourceProfile;
  synthetic?: SyntheticReport;
  skeptic?: SkepticReport;
  sourceError?: string;
  fetchedTitle?: string;
  scenario?: {
    kind: string;
    label: string;
    explanation: string;
    evidenceToGather: string[];
    suggestedActions: string[];
  };
  aiVerification?: {
    ran: boolean;
    ok: boolean;
    error?: string;
    model?: string;
  };
  languageNote?: string;
  aiCitations?: { title: string; url: string; note: string }[];
  reference?: {
    found: boolean;
    title?: string;
    extract?: string;
    url?: string;
  };
  claims: Claim[];
  evidence: Evidence[];
  relationships: EvidenceRelationship[];
  timeline: InvestigationStep[];
  actions: CaseAction[];
  reports: Report[];
  watches: Watch[];
  error?: string;
}

export interface CreateCaseInput {
  question: string;
  input: string;
  inputType?: TruthCase["inputType"];
}

export type PipelineEvent =
  | { type: "step"; stepId: string; label: string; status: "active" | "complete" | "warning" | "error"; detail: string }
  | { type: "counts"; claims: number; evidence: number; contradictions: number }
  | { type: "skeptic"; confidenceBefore: number; confidenceAfter: number }
  | { type: "verdict"; verdict: VerdictStatus; confidence: number }
  | { type: "done"; caseId: string }
  | { type: "error"; message: string };
