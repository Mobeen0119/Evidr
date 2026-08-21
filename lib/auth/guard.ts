import { NextResponse } from "next/server";
import { getCurrentSession } from "./session";

export async function requireUserPage() {
  const session = await getCurrentSession();
  if (!session) {
    return { userId: "guest-fallback", email: null, isGuest: true };
  }
  return session;
}

export async function requireUserApi() {
  const session = await getCurrentSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "No session. Refresh the page and try again." }, { status: 401 }) };
  }
  return { session, response: null };
}
