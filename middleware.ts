import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "evidr_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 180;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

async function readSession(token: string, secret: Uint8Array) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

async function createGuestToken(secret: Uint8Array) {
  const userId = `guest-${crypto.randomUUID()}`;
  const token = await new SignJWT({ userId, email: null, isGuest: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
  return token;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const secret = getSecret();
  if (!secret) {
    return NextResponse.next();
  }

  const existing = request.cookies.get(COOKIE_NAME)?.value;
  const valid = existing ? await readSession(existing, secret) : null;

  if (valid) {
    return NextResponse.next();
  }

  const token = await createGuestToken(secret);
  request.cookies.set(COOKIE_NAME, token);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
