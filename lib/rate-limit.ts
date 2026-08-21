import { rawDb } from "@/lib/database/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const upsertStmt = rawDb.prepare(
  `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
   ON CONFLICT(key) DO UPDATE SET count = count + 1
   WHERE window_start = excluded.window_start`
);

const selectStmt = rawDb.prepare(`SELECT count, window_start as windowStart FROM rate_limits WHERE key = ?`);
const resetStmt = rawDb.prepare(
  `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
   ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`
);

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  const existing = selectStmt.get(key) as { count: number; windowStart: number } | undefined;

  if (!existing || existing.windowStart !== windowStart) {
    resetStmt.run(key, windowStart);
    return { allowed: true, remaining: limit - 1, resetAt: windowStart + windowMs };
  }

  upsertStmt.run(key, windowStart);
  const updated = selectStmt.get(key) as { count: number; windowStart: number };
  const allowed = updated.count <= limit;
  return { allowed, remaining: Math.max(0, limit - updated.count), resetAt: windowStart + windowMs };
}

export function rateLimitHeaders(result: RateLimitResult, limit: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
