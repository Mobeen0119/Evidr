import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/database/db";
import { users } from "@/lib/database/schema";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429, headers: rateLimitHeaders(limit, 5) });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  await db.insert(users).values({ id, email, passwordHash, name: name || null, createdAt: new Date() });

  await setSessionCookie({ userId: id, email, isGuest: false });
  return NextResponse.json({ id, email, name: name || null });
}
