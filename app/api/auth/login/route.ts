import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/database/db";
import { users } from "@/lib/database/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429, headers: rateLimitHeaders(limit, 8) });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.email, email));
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (!user.passwordHash) {
    return NextResponse.json({ error: "This account uses Google sign-in. Use the 'Sign in with Google' button instead." }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSessionCookie({ userId: user.id, email: user.email, isGuest: false });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
