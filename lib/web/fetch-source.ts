export interface SourceFetchResult {
  ok: boolean;
  text: string;
  title?: string;
  reason?: string;
  isHttps?: boolean;
  markers?: {
    hasPrivacyPolicy: boolean;
    hasAboutOrContact: boolean;
    hasByline: boolean;
    hasPublishDate: boolean;
    hasOutboundCitationLinks: boolean;
    outboundLinkCount: number;
  };
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/<[^>]+>/g, "").trim().slice(0, 120) : undefined;
}

import { validateResolvedUrl } from "./validation";

export async function fetchSourceText(url: string): Promise<SourceFetchResult> {
  try {
    let currentUrl = url;
    let response: Response | undefined;

    for (let redirectCount = 0; redirectCount < 5; redirectCount++) {
      const preCheck = await validateResolvedUrl(currentUrl);
      if (preCheck) return { ok: false, text: "", reason: preCheck };

      response = await fetch(currentUrl, {
        headers: { "user-agent": "Sleuth local investigation fetcher" },
        signal: AbortSignal.timeout(8000),
        redirect: "manual"
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return { ok: false, text: "", reason: "Redirected with no destination given." };
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!response) return { ok: false, text: "", reason: "Too many redirects." };
    if (!response.ok) return { ok: false, text: "", reason: `HTTP ${response.status}` };

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/json|application\/xml|text\/xml/i.test(contentType)) {
      return { ok: false, text: "", reason: `Unsupported content type: ${contentType || "unknown"}` };
    }

    const raw = (await response.text()).slice(0, 160_000);
    const title = contentType.includes("html") ? extractTitle(raw) : undefined;
    const text = contentType.includes("html") ? stripHtml(raw) : raw.replace(/\s+/g, " ").trim();
    if (!text) return { ok: false, text: "", reason: "No readable text found" };

    const lowerRaw = raw.toLowerCase();
    const outboundLinks = raw.match(/href=["']https?:\/\/[^"']+["']/gi) ?? [];
    let sourceHost = "";
    try {
      sourceHost = new URL(url).hostname;
    } catch {
      sourceHost = "";
    }
    const outboundToOtherDomains = outboundLinks.filter((l) => !l.includes(sourceHost));

    const markers = {
      hasPrivacyPolicy: /privacy[\s-]?policy/i.test(lowerRaw),
      hasAboutOrContact: /\b(about us|about-us|\/about|contact us|contact-us|\/contact)\b/i.test(lowerRaw),
      hasByline: /<meta[^>]+(author|byline)[^>]*>/i.test(raw) || /\bby\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(raw.slice(0, 2000)),
      hasPublishDate: /<meta[^>]+(article:published_time|datepublished|publishdate)[^>]*>/i.test(raw) || /\b(20\d\d)-\d{2}-\d{2}\b/.test(raw),
      hasOutboundCitationLinks: outboundToOtherDomains.length >= 2,
      outboundLinkCount: outboundToOtherDomains.length
    };

    return { ok: true, text: text.slice(0, 18_000), title, isHttps: url.startsWith("https://"), markers };
  } catch (error) {
    return { ok: false, text: "", reason: error instanceof Error ? error.message : "Source fetch failed" };
  }
}
