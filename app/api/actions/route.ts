import { NextResponse } from "next/server";
import { getCase } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { generateActions } from "@/lib/actions/generator";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { caseId } = await request.json();
  const caseRecord = await getCase(String(caseId), session.userId);
  if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ actions: generateActions(caseRecord) });
}
