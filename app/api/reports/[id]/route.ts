import { NextResponse } from "next/server";
import { getCase, saveCase } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { generateReport } from "@/lib/reports/generator";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const caseRecord = await getCase(id, session.userId);
  if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  const report = generateReport(caseRecord);
  const updated = { ...caseRecord, reports: [report, ...caseRecord.reports.filter((r) => r.id !== report.id)] };
  await saveCase(updated, session.userId);
  return NextResponse.json({ report });
}
