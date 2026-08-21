import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { exchangeGoogleCode, fetchGoogleUserInfo, googleOAuthConfigured } from "@/lib/auth/google";
import { setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/database/db";
import { users } from "@/lib/database/schema";
import { checkRateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(`${url.origin}/login?error=google_not_configured`);
  }

  const limit = checkRateLimit(`google-oauth:${requestIp(request)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: rateLimitHeaders(limit, 20) });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(/google_oauth_state=([^;]+)/)?.[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${url.origin}/login?error=google_state_mismatch`);
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const tokens = await exchangeGoogleCode(code, redirectUri);
  if (!tokens) {
    return NextResponse.redirect(`${url.origin}/login?error=google_token_exchange_failed`);
  }

  const profile = await fetchGoogleUserInfo(tokens.access_token);
  if (!profile || !profile.email || !profile.email_verified) {
    return NextResponse.redirect(`${url.origin}/login?error=google_profile_unavailable`);
  }

  const byGoogleId = await db.select().from(users).where(eq(users.googleId, profile.sub));
  let userId: string;
  let userName: string | null;

  if (byGoogleId[0]) {
    userId = byGoogleId[0].id;
    userName = byGoogleId[0].name;
  } else {
    const byEmail = await db.select().from(users).where(eq(users.email, profile.email));
    if (byEmail[0]) {
      userId = byEmail[0].id;
      userName = byEmail[0].name ?? profile.name ?? null;
      await db.update(users).set({ googleId: profile.sub, name: userName }).where(eq(users.id, userId));
    } else {
      userId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      userName = profile.name ?? null;
      await db.insert(users).values({
        id: userId,
        email: profile.email,
        googleId: profile.sub,
        name: userName,
        passwordHash: null,
        createdAt: new Date()
      });
    }
  }

  await setSessionCookie({ userId, email: profile.email, isGuest: false });

  const response = NextResponse.redirect(`${url.origin}/dashboard`);
  response.cookies.delete("google_oauth_state");
  return response;
}
