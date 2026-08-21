import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { checkRateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 8_000_000;

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = checkRateLimit(`upload:${session.userId}`, 15, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many file uploads this hour. Please try again later." }, { status: 429, headers: rateLimitHeaders(limit, 15) });
  }
  const ipLimit = checkRateLimit(`upload-ip:${requestIp(request)}`, 30, 60 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: "Too many uploads from this network. Please try again later." }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file was received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File is too large (${(file.size / 1_000_000).toFixed(1)}MB). Limit is 8MB.` }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (name.endsWith(".pdf")) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });
      const trimmed = text?.trim();
      if (!trimmed) return NextResponse.json({ error: "Couldn't find any readable text in this PDF. It may be a scanned image without an OCR text layer." }, { status: 422 });
      return NextResponse.json({ text: trimmed.slice(0, 100_000), pages: totalPages });
    }

    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim();
      if (!text) return NextResponse.json({ error: "Couldn't find any readable text in this document." }, { status: 422 });
      return NextResponse.json({ text: text.slice(0, 100_000) });
    }

    if (/\.(png|jpe?g|webp|bmp|gif)$/.test(name)) {
      const { createWorker } = await import("tesseract.js");
      const path = await import("path");
      const workerPath = path.join(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js");
      const worker = await createWorker("eng", 1, { workerPath });
      try {
        const { data } = await worker.recognize(buffer);
        const text = data.text?.trim();
        if (!text) {
          return NextResponse.json({ error: "Couldn't find any readable text in this image. Try a clearer screenshot." }, { status: 422 });
        }
        return NextResponse.json({ text: text.slice(0, 20_000) });
      } finally {
        await worker.terminate();
      }
    }

    return NextResponse.json({ error: "Unsupported file type. Upload a .pdf, .docx, .txt, .md, .csv file, or a screenshot (.png/.jpg)." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `Couldn't read this file: ${err.message}` : "Couldn't read this file." },
      { status: 422 }
    );
  }
}
