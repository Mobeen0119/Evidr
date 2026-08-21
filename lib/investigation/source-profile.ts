import type { CreateCaseInput, SourceProfile, VerificationCheck } from "@/types/investigation";
import type { SourceFetchResult } from "@/lib/web/fetch-source";
import { analyzeDomain } from "./domain-reputation";

export interface SourceProfileInput {
  input: CreateCaseInput;
  fetchOk?: boolean;
  fetchedTitle?: string;
  fetchResult?: SourceFetchResult;
}

function hostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function buildSourceProfile({ input, fetchOk, fetchedTitle, fetchResult }: SourceProfileInput): SourceProfile {
  const host = hostname(input.input);
  const isUrl = Boolean(host);
  const inputText = `${input.question} ${fetchedTitle ?? ""} ${input.input}`.toLowerCase();
  const hasCitations = /https?:\/\/|doi\.|journal|study|report|filing|policy|section|appendix|sources?|references?/.test(inputText);
  const hasNamedOrg = /company|publisher|university|agency|court|journal|hospital|department|institute|foundation/.test(inputText);
  const hasMarketing = /best|guarantee|breakthrough|secret|limited time|miracle|shocking|click here|free gift/.test(inputText);
  const hasDates = /\b(20\d\d)\b/.test(inputText);

  const checks: VerificationCheck[] = [];
  let domainScore: number | undefined;

  if (isUrl && host) {
    const domainAnalysis = analyzeDomain(host);
    domainScore = domainAnalysis.score;
    checks.push({
      label: "Domain reputation",
      status: domainAnalysis.score >= 65 ? "pass" : domainAnalysis.score >= 40 ? "warn" : "fail",
      detail: domainAnalysis.signals.length
        ? domainAnalysis.signals.map((s) => s.detail).join(" ")
        : `No specific reputation signals found for ${host}. Neither confirmed high-trust nor confirmed high-risk — treat as unverified.`
    });

    checks.push({
      label: "HTTPS / transport security",
      status: fetchResult?.isHttps ? "pass" : "warn",
      detail: fetchResult?.isHttps
        ? "Site is served over HTTPS."
        : "Site is not served over HTTPS, or this could not be confirmed. Reputable modern sites almost universally use HTTPS."
    });

    if (fetchOk && fetchResult?.markers) {
      const m = fetchResult.markers;
      checks.push({
        label: "Publisher transparency (about/contact)",
        status: m.hasAboutOrContact ? "pass" : "warn",
        detail: m.hasAboutOrContact
          ? "Page or site appears to reference an About or Contact section."
          : "No About or Contact reference detected on the page. Legitimate publishers usually disclose who they are."
      });
      checks.push({
        label: "Privacy policy present",
        status: m.hasPrivacyPolicy ? "pass" : "warn",
        detail: m.hasPrivacyPolicy
          ? "A privacy policy reference was found."
          : "No privacy policy reference was found on the page — common on throwaway or low-effort sites."
      });
      checks.push({
        label: "Byline / authorship",
        status: m.hasByline ? "pass" : "unknown",
        detail: m.hasByline
          ? "An author byline or authorship metadata was detected."
          : "No clear author byline detected. Unattributed content is harder to hold accountable."
      });
      checks.push({
        label: "Publish date present",
        status: m.hasPublishDate ? "pass" : "warn",
        detail: m.hasPublishDate
          ? "A publish date was detected in the page metadata or text."
          : "No publish date detected — undated claims are harder to verify against a timeline."
      });
      checks.push({
        label: "Cites outside sources",
        status: m.hasOutboundCitationLinks ? "pass" : "warn",
        detail: m.hasOutboundCitationLinks
          ? `Page links out to ${m.outboundLinkCount} other domain(s), suggesting it cites external material.`
          : "Page does not link out to other domains. Content that cites nothing external is harder to independently corroborate."
      });
    } else if (isUrl && !fetchOk) {
      checks.push({
        label: "Page content markers",
        status: "unknown",
        detail: "The page could not be fetched, so on-page transparency markers (privacy policy, byline, date) could not be checked."
      });
    }
  } else {
    checks.push({
      label: "Source type",
      status: "unknown",
      detail: "This submission is pasted text or a document, not a URL, so domain-level and page-level checks do not apply. Verification here relies on internal consistency and any citations within the text itself."
    });
  }

  const domainFloor = domainScore !== undefined ? domainScore * 0.5 : 0;
  const authority = Math.max(
    10,
    Math.min(90, (isUrl ? (fetchOk ? 45 : 32) : 40) + domainFloor * 0.4 + (hasNamedOrg ? 10 : 0) + (hasCitations ? 8 : 0) + (hasDates ? 3 : 0) - (hasMarketing ? 12 : 0))
  );
  const transparency = Math.max(
    10,
    Math.min(85, (hasCitations ? 45 : 30) + (isUrl && fetchOk ? 8 : 0) + (hasNamedOrg ? 6 : 0) + checks.filter((c) => c.status === "pass").length * 4 - checks.filter((c) => c.status === "fail").length * 10 - (hasMarketing ? 8 : 0))
  );

  const history: string[] = [];
  if (isUrl) {
    history.push(fetchOk
      ? `URL host identified as ${host}; the page was fetched and its content analyzed against free domain-reputation and page-transparency heuristics.`
      : `URL host identified as ${host}, but the page could not be fetched. Scoring is provisional and based on the domain string only.`);
    history.push(fetchOk && fetchedTitle ? `Fetched title: "${fetchedTitle}".` : "No fetched title available.");
  } else {
    history.push("Material was supplied directly by the user; no publisher reputation can be inferred without a source URL.");
  }
  history.push(hasCitations
    ? "The submission references evidence-like material; those specific references have not been independently fetched and verified unless AI web-search verification is enabled."
    : "No independent citations were detected in the submitted text.");
  history.push("This is a heuristic assessment, not a certification. It never substitutes for reading the primary source yourself.");

  return {
    publisher: host ?? (fetchedTitle ? `${fetchedTitle.slice(0, 48)}` : "Submitted material"),
    url: host ? input.input : undefined,
    authority: Math.round(authority),
    transparency: Math.round(transparency),
    independentCorroboration: hasCitations ? 28 : 0,
    knownConflicts: hasMarketing ? 1 : 0,
    history,
    verificationChecks: checks,
    domainScore
  };
}
