import { NextResponse } from "next/server";
import { googleOAuthConfigured, buildGoogleAuthUrl } from "@/lib/auth/google";

export async function GET(request: Request) {
  if (!googleOAuthConfigured()) {
    return NextResponse.json({ error: "Google sign-in is not configured on this deployment." }, { status: 501 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();

  const response = NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600
  });
  return response;
}
