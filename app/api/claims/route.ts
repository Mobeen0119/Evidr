import { NextResponse } from "next/server";
import { getCase } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const caseId = new URL(request.url).searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  const caseRecord = await getCase(caseId, session.userId);
  if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ claims: caseRecord.claims });
}
