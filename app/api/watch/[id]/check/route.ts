import { NextResponse } from "next/server";
import { getCase, saveCase } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { fetchSourceText } from "@/lib/web/fetch-source";
import { extractClaims, extractNumericMetrics } from "@/lib/investigation/claims";

interface NumericNote {
  claimId: string;
  text: string;
  value: number;
  unit: string;
  raw: string;
}

function collectNumbers(claims: { id: string; text: string }[]): NumericNote[] {
  const notes: NumericNote[] = [];
  for (const claim of claims) {
    for (const metric of extractNumericMetrics(claim.text)) {
      if (metric.unit === "count") continue;
      notes.push({ claimId: claim.id, text: claim.text.slice(0, 80), value: metric.value, unit: metric.unit, raw: metric.raw });
    }
  }
  return notes;
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const caseRecord = await getCase(id, session.userId);
  if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  const activeWatches = caseRecord.watches.filter((w) => w.status === "active");
  if (!activeWatches.length) return NextResponse.json({ error: "No active watches for this case" }, { status: 400 });

  const checkedAt = new Date().toISOString();
  const isUrl = /^https?:\/\//i.test(caseRecord.input.trim());
  let development: string;

  if (!isUrl) {
    const previous = collectNumbers(caseRecord.claims);
    development = previous.length
      ? `No live source is attached to this case (pasted material only). Re-analysis found ${caseRecord.claims.length} claim(s) with ${previous.length} measurable figure(s). Scheduled checks require a URL source or a search provider.`
      : `No live source is attached to this case (pasted material only). Scheduled checks require a URL source or a search provider.`;
  } else {
    const fetched = await fetchSourceText(caseRecord.input.trim());
    if (!fetched.ok) {
      development = `SOURCE UNAVAILABLE — Reason: ${fetched.reason}. The previously recorded conclusion remains unchanged.`;
    } else {
      const previousNumbers = collectNumbers(caseRecord.claims);
      const freshClaims = extractClaims({ question: caseRecord.question, input: fetched.text }, id);
      const freshNumbers = collectNumbers(freshClaims);

      const changed: string[] = [];
      const prevByKey = new Map<string, number>();
      for (const n of previousNumbers) prevByKey.set(`${n.claimId}:${n.unit}`, n.value);
      const matched = new Set<string>();
      for (const n of freshNumbers) {
        const key = `${n.claimId}:${n.unit}`;
        const prev = prevByKey.get(key);
        matched.add(key);
        if (prev !== undefined && Math.abs(prev - n.value) / Math.max(Math.abs(prev), 1) > 0.05) {
          changed.push(`Figure changed for a claim: was ~${prev}, now ~${n.value} (${n.unit}).`);
        }
      }
      for (const n of previousNumbers) {
        if (!matched.has(`${n.claimId}:${n.unit}`)) changed.push(`A previously detected figure (${n.raw}, ${n.unit}) no longer appears in the current fetch.`);
      }
      if (changed.length) {
        development = `NEW DEVELOPMENT — ${changed.length} change(s) detected in the source since last check.\n\n${changed.map((c) => `• ${c}`).join("\n")}\n\nPrevious conclusion: ${caseRecord.verdict.toUpperCase()} (${caseRecord.confidence}%). The source content may have changed; consider re-running the full investigation.`;
      } else {
        development = `No material change detected. The source still contains ${freshClaims.length} claim(s) consistent with the previous analysis. Previous conclusion: ${caseRecord.verdict.toUpperCase()} (${caseRecord.confidence}%).`;
      }
    }
  }

  const updatedWatches = caseRecord.watches.map((w) =>
    w.status === "active" ? { ...w, lastChecked: checkedAt, latestDevelopment: development } : w
  );
  const updated = { ...caseRecord, watches: updatedWatches, updatedAt: checkedAt };
  await saveCase(updated, session.userId);
  return NextResponse.json({ checkedAt, development, watch: updatedWatches.find((w) => w.status === "active") });
}
