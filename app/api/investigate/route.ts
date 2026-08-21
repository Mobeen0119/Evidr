import { runInvestigationPipeline } from "@/lib/investigation/pipeline";
import { validateResolvedUrl } from "@/lib/web/validation";
import { normalizeMaybeUrl } from "@/lib/web/normalize-url";
import { getCurrentSession } from "@/lib/auth/session";
import { checkRateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";
import type { CreateCaseInput, PipelineEvent, TruthCase } from "@/types/investigation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const limit = checkRateLimit(`investigate:${session.userId}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return Response.json(
      { error: "You've hit the hourly investigation limit. Please try again later." },
      { status: 429, headers: rateLimitHeaders(limit, 20) }
    );
  }
  const ipLimit = checkRateLimit(`investigate-ip:${requestIp(request)}`, 40, 60 * 60 * 1000);
  if (!ipLimit.allowed) {
    return Response.json({ error: "Too many requests from this network. Please try again later." }, { status: 429, headers: rateLimitHeaders(ipLimit, 40) });
  }

  let body: { question?: string; input?: string; inputType?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = String(body.question ?? "").trim();
  const input = normalizeMaybeUrl(String(body.input ?? "").trim());
  const inputType = body.inputType;
  if (!question && !input) return Response.json({ error: "Provide a question or source material." }, { status: 400 });
  if (input.length > 20000) return Response.json({ error: "Input is too long (20,000 character limit)." }, { status: 400 });
  if (/^https?:\/\//i.test(input)) {
    const urlError = await validateResolvedUrl(input);
    if (urlError) return Response.json({ error: urlError }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PipelineEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        const generator = runInvestigationPipeline(
          { question, input, inputType: inputType as CreateCaseInput["inputType"] },
          { userId: session.userId }
        );
        let result: IteratorResult<PipelineEvent, TruthCase>;
        do {
          result = await generator.next();
          if (!result.done) send(result.value);
        } while (!result.done);
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "Investigation failed" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      "x-accel-buffering": "no",
      ...rateLimitHeaders(limit, 20),
    }
  });
}
