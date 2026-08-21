"use client";
import { useState } from "react";
import { Check, ClipboardCopy, Download, FileDown } from "lucide-react";

function markdownToPdf(markdown: string, title: string) {
  return import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 56;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    function ensureSpace(lineHeight: number) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function writeParagraph(text: string, size: number, style: "normal" | "bold" | "italic", spacingAfter: number) {
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxWidth) as string[];
      for (const line of lines) {
        ensureSpace(size + 4);
        doc.text(line, margin, y);
        y += size + 4;
      }
      y += spacingAfter;
    }

    const rawLines = markdown.split("\n");
    for (const raw of rawLines) {
      const line = raw.trim();
      if (!line) {
        y += 6;
        continue;
      }
      if (line.startsWith("# ")) {
        writeParagraph(line.slice(2), 20, "bold", 10);
      } else if (line.startsWith("## ")) {
        writeParagraph(line.slice(3), 14, "bold", 8);
      } else if (line.startsWith("- ")) {
        const clean = line.slice(2).replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/_/g, "");
        writeParagraph(`•  ${clean}`, 11, "normal", 3);
      } else if (line.startsWith("**") && line.endsWith("**")) {
        writeParagraph(line.replace(/\*\*/g, ""), 12, "bold", 6);
      } else {
        const clean = line.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)").replace(/_/g, "");
        writeParagraph(clean, 11, "normal", 6);
      }
    }

    const filename = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "report"}.pdf`;
    doc.save(filename);
  });
}

export function ReportToolbar({ markdown, title }: { markdown: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function downloadPdf() {
    setGenerating(true);
    try {
      await markdownToPdf(markdown, title);
    } finally {
      setGenerating(false);
    }
  }

  async function downloadText() {
    const blob = new Blob([markdown], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "report"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {

    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={downloadPdf}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-lg border border-case-cyan/50 bg-case-cyan/10 px-3 py-2 text-xs font-medium text-case-text transition hover:border-case-cyan hover:bg-case-cyan/20 disabled:opacity-60"
      >
        <Download size={14} /> {generating ? "Preparing..." : "Download as PDF"}
      </button>
      <button onClick={downloadText} className="inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted transition hover:border-case-cyan/60 hover:text-case-text">
        <FileDown size={14} /> Plain text copy
      </button>
      <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-case-border px-3 py-2 text-xs font-medium text-case-muted transition hover:border-case-cyan/60 hover:text-case-text">
        {copied ? <Check size={14} className="text-case-green" /> : <ClipboardCopy size={14} />} {copied ? "Copied" : "Copy text"}
      </button>
    </div>
  );
}
