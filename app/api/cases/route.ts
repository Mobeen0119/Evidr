import { NextResponse } from "next/server";
import { listCases } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ cases: await listCases(session.userId) });
}
