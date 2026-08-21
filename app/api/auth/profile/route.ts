import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/database/db";
import { users } from "@/lib/database/schema";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.isGuest) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });

  const limit = checkRateLimit(`profile-update:${session.userId}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many updates. Try again later." }, { status: 429, headers: rateLimitHeaders(limit, 10) });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : undefined;
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;

  const updates: { name?: string; passwordHash?: string } = {};

  if (name !== undefined) {
    updates.name = name;
  }

  if (newPassword) {
    const rows = await db.select().from(users).where(eq(users.id, session.userId));
    const user = rows[0];
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Enter your current password to set a new one." }, { status: 400 });
      }
      const ok = await verifyPassword(currentPassword, user.passwordHash);
      if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 });
    updates.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, session.userId));
  return NextResponse.json({ ok: true });
}
