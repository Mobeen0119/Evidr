import { NextResponse } from "next/server";
import { getCase, saveCase } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { caseId, target } = await request.json();
  const caseRecord = await getCase(String(caseId), session.userId);
  if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  const watch = { id: `watch-${Date.now()}`, caseId: caseRecord.id, target: String(target ?? caseRecord.title), cadence: "manual" as const, status: "active" as const, latestDevelopment: "Manual watch created. Scheduled job adapter can be connected later." };
  const updated = { ...caseRecord, watches: [watch, ...caseRecord.watches] };
  await saveCase(updated, session.userId);
  return NextResponse.json({ watch });
}
