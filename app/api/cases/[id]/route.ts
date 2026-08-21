import { NextResponse } from "next/server";
import { getCase } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const caseRecord = await getCase(id, session.userId);
  if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ case: caseRecord });
}
