import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/database/db";
import { users } from "@/lib/database/schema";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  if (session.isGuest) {
    return NextResponse.json({ user: { id: session.userId, email: null, name: null, isGuest: true } });
  }
  const rows = await db.select({ name: users.name }).from(users).where(eq(users.id, session.userId));
  return NextResponse.json({ user: { id: session.userId, email: session.email, name: rows[0]?.name ?? null, isGuest: false } });
}
