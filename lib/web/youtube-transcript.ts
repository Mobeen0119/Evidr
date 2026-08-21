import { YoutubeTranscript } from "@danielxceron/youtube-transcript";

export interface YoutubeResult {
  ok: boolean;
  reason?: string;
  title?: string;
  channel?: string;
  transcript?: string;
}

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchVideoTitle(videoId: string): Promise<{ title?: string; channel?: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
    if (!res.ok) return {};
    const data = await res.json();
    return { title: data.title, channel: data.author_name };
  } catch {
    return {};
  }
}

export async function fetchYoutubeTranscript(url: string): Promise<YoutubeResult> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return { ok: false, reason: "This doesn't look like a YouTube video link." };

  const { title, channel } = await fetchVideoTitle(videoId);

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = segments
      .map((s) => s.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript) {
      return { ok: false, reason: "Captions were found but appear to be empty.", title, channel };
    }

    return { ok: true, title, channel, transcript: transcript.slice(0, 60_000) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong reading this video.";
    if (/disabled/i.test(message)) {
      return { ok: false, reason: "Captions are disabled on this video.", title, channel };
    }
    if (/unavailable/i.test(message)) {
      return { ok: false, reason: "This video is unavailable or private.", title, channel };
    }
    if (/no transcripts|not available/i.test(message)) {
      return { ok: false, reason: "This video doesn't have captions available, so no transcript can be read.", title, channel };
    }
    return { ok: false, reason: `Couldn't read this video's captions: ${message}`, title, channel };
  }
}
