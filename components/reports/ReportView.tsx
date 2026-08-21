import { Fragment } from "react";

function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|_[^_]+_)/g);
  return (
    <Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-case-text">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
          return (
            <em key={i} className="text-case-muted">
              {part.slice(1, -1)}
            </em>
          );
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-case-cyan hover:underline">
              {linkMatch[1]}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </Fragment>
  );
}

export function ReportView({ markdown }: { markdown: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`list-${listKey++}`} className="my-3 space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="leading-6 text-case-muted">
            <span className="mr-2 text-case-cyan">—</span>
            {renderInline(item, i)}
          </li>
        ))}
      </ul>
    );
    list = [];
  };

  const lines = markdown.split("\n");
  lines.forEach((line, index) => {
    if (line.trim() === "") {
      flushList();
      return;
    }
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${index}`} className="mb-2 mt-6 text-base font-semibold text-case-text">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${index}`} className="mb-2 mt-7 border-b border-case-border pb-1.5 text-lg font-semibold text-case-text">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={`h1-${index}`} className="mb-4 mt-2 text-2xl font-semibold tracking-tight text-case-text">
          {line.slice(2)}
        </h1>
      );
      return;
    }
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      return;
    }
    flushList();
    blocks.push(
      <p key={`p-${index}`} className="my-2 leading-7 text-case-muted">
        {renderInline(line, index)}
      </p>
    );
  });
  flushList();

  return (
    <div className="rounded-2xl border border-case-border bg-case-panel p-6 shadow-evidence sm:p-10">
      <article className="mx-auto max-w-3xl">{blocks}</article>
    </div>
  );
}
