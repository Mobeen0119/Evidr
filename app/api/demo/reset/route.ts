import { NextResponse } from "next/server";
import { resetLocalData } from "@/lib/database/repository";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await resetLocalData(session.userId);
  return NextResponse.json({ ok: true, message: "Local data reset. Demo case re-seeded." });
}
