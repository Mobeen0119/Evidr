export interface DomainSignal {
  label: string;
  detail: string;
  weight: number;
}

const HIGH_TRUST_SUFFIXES = [".gov", ".mil", ".edu"];

const HIGH_TRUST_DOMAINS = new Set([
  "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "npr.org", "nytimes.com", "wsj.com",
  "washingtonpost.com", "theguardian.com", "economist.com", "nature.com", "science.org",
  "who.int", "un.org", "worldbank.org", "imf.org", "sec.gov", "ftc.gov", "usa.gov",
  "wikipedia.org", "archive.org", "amazon.com", "ups.com", "fedex.com", "usps.com", "dhl.com",
  "paypal.com", "visa.com", "mastercard.com"
]);

const HIGH_RISK_TLDS = new Set([".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work", ".click", ".zip", ".gq"]);

const URL_SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"]);

function tld(host: string) {
  const parts = host.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
}

export function analyzeDomain(host: string): { score: number; signals: DomainSignal[] } {
  const signals: DomainSignal[] = [];
  const lowerHost = host.toLowerCase().replace(/^www\./, "");
  const domainTld = tld(lowerHost);

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(lowerHost)) {
    signals.push({ label: "Raw IP address", detail: "The link points directly to an IP address rather than a named domain, which is unusual for legitimate content and common in scam/phishing links.", weight: -30 });
  }

  if (lowerHost.startsWith("xn--")) {
    signals.push({ label: "Punycode domain", detail: "This is an internationalized (punycode) domain. These are sometimes used to visually impersonate a well-known site (homograph attack).", weight: -20 });
  }

  if (HIGH_TRUST_SUFFIXES.some((s) => lowerHost.endsWith(s))) {
    signals.push({ label: "Institutional TLD", detail: `Domain ends in ${HIGH_TRUST_SUFFIXES.find((s) => lowerHost.endsWith(s))}, restricted to government, military, or accredited educational institutions.`, weight: 25 });
  }

  if (HIGH_TRUST_DOMAINS.has(lowerHost)) {
    signals.push({ label: "Recognized major publisher/institution", detail: `${lowerHost} is a widely recognized major news, government, or institutional domain.`, weight: 25 });
  }

  if (HIGH_RISK_TLDS.has(domainTld)) {
    signals.push({ label: "High-abuse TLD", detail: `The ${domainTld} top-level domain is free or very cheap to register and is disproportionately used for spam, scams, and throwaway sites. This alone is not proof of bad intent, but it lowers baseline trust.`, weight: -15 });
  }

  if (URL_SHORTENERS.has(lowerHost)) {
    signals.push({ label: "URL shortener", detail: "This is a link-shortener domain, which hides the real destination and is commonly used to bypass spam/phishing filters.", weight: -20 });
  }

  const hyphenCount = (lowerHost.match(/-/g) ?? []).length;
  if (hyphenCount >= 3) {
    signals.push({ label: "Unusual hyphenation", detail: `The domain contains ${hyphenCount} hyphens. Domains with many hyphens are more often typosquats or throwaway sites than established publishers.`, weight: -10 });
  }

  const subdomainDepth = lowerHost.split(".").length - 2;
  if (subdomainDepth >= 3) {
    signals.push({ label: "Deep subdomain nesting", detail: `The host has ${subdomainDepth} subdomain levels, which is unusual for a primary publisher domain and sometimes used to obscure the true root domain.`, weight: -8 });
  }

  const brandImpersonationPattern = /(paypal|amazon|apple|microsoft|google|bank|irs|usps|fedex|ups|dhl)[-.]?(?!\.com$|\.org$)/i;
  if (brandImpersonationPattern.test(lowerHost) && !HIGH_TRUST_DOMAINS.has(lowerHost)) {
    signals.push({ label: "Possible brand impersonation", detail: "The domain contains a well-known brand name but is not that brand's actual domain — a common typosquatting/phishing pattern.", weight: -25 });
  }

  const baseline = 50;
  const score = Math.max(0, Math.min(100, baseline + signals.reduce((sum, s) => sum + s.weight, 0)));

  return { score, signals };
}
