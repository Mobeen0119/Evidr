"use client";
import { useState } from "react";
import { FileUp, Search, X, Loader2, ChevronDown } from "lucide-react";

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".csv", ".json", ".xml", ".log"];
const PARSED_EXTENSIONS = [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];
const ALLOWED_EXTENSIONS = [...TEXT_EXTENSIONS, ...PARSED_EXTENSIONS];
const MAX_TEXT_BYTES = 1_000_000;
const MAX_PARSED_BYTES = 8_000_000;

interface Props {
  onSubmit: (question: string, input: string) => void;
  running?: boolean;
  error?: string;
}

export function InvestigationForm({ onSubmit, running, error }: Props) {
  const [question, setQuestion] = useState("");
  const [showQuestion, setShowQuestion] = useState(false);
  const [input, setInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [parsing, setParsing] = useState(false);

  async function handleFile(file: File | undefined) {
    setUploadError("");
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`That file type isn't supported. Try PDF, Word, a screenshot, or a plain text file.`);
      return;
    }

    if (PARSED_EXTENSIONS.includes(ext)) {
      if (file.size > MAX_PARSED_BYTES) {
        setUploadError(`That file is ${(file.size / 1_000_000).toFixed(1)}MB; the limit is 8MB.`);
        return;
      }
      setParsing(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload/parse", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error ?? "Couldn't read this file.");
          return;
        }
        setFileName(file.name);
        setInput((prev) => (prev.trim() ? `${prev}\n\n─── ${file.name} ───\n${data.text.trim()}` : data.text.trim()));
      } catch {
        setUploadError("Couldn't read this file. Try again or paste the text directly.");
      } finally {
        setParsing(false);
      }
      return;
    }

    if (file.size > MAX_TEXT_BYTES) {
      setUploadError(`That file is a bit large (limit is 1MB for plain text).`);
      return;
    }
    const text = (await file.text()).slice(0, 100_000);
    if (!text.trim()) {
      setUploadError("That file didn't have any readable text in it.");
      return;
    }
    setFileName(file.name);
    setInput((prev) => (prev.trim() ? `${prev}\n\n─── ${file.name} ───\n${text.trim()}` : text.trim()));
  }

  const canSubmit = !running && !parsing && (input.trim().length > 0 || question.trim().length > 0);

  return (
    <div className="evidence-pulse rounded-2xl border border-case-border bg-case-panel p-4 sm:p-5">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-case-muted">
        Paste a link, message, document, or just describe what's going on
      </label>
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-36 w-full resize-y rounded-xl border border-case-border bg-black/30 p-3 pr-10 text-sm outline-none focus:border-case-cyan"
          placeholder={`e.g. "https://example.com/article" or "my order is 6 days late" or paste the text of a message someone sent you`}
        />
        {input && (
          <button
            onClick={() => setInput("")}
            className="absolute right-2.5 top-2.5 rounded-md p-1 text-case-muted hover:bg-white/10 hover:text-case-text"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-case-border px-2.5 py-1.5 text-xs text-case-muted hover:border-case-cyan/50 hover:text-case-text">
          {parsing ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />}
          {parsing ? "Reading file..." : fileName ? fileName : "Attach a file instead"}
          <input
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(",")}
            disabled={parsing}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        <button
          onClick={() => setShowQuestion((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-case-muted hover:text-case-text"
        >
          Ask something specific <ChevronDown size={13} className={`transition-transform ${showQuestion ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showQuestion && (
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-2 w-full rounded-lg border border-case-border bg-black/30 p-2.5 text-sm outline-none focus:border-case-cyan"
          placeholder='e.g. "Is this true?" or "What can I do about this?" — optional, we ask this by default'
        />
      )}

      {uploadError && <p className="mt-2 text-sm text-case-red">{uploadError}</p>}
      {error && <p className="mt-2 text-sm text-case-red">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onSubmit(question.trim() || "What should I know about this?", input.trim())}
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-case-cyan px-5 py-3 text-sm font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Search size={16} />
          {running ? "Checking..." : "Check this"}
        </button>
      </div>
    </div>
  );
}
