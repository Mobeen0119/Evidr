"use client";
import { useState } from "react";

export function ResetDataButton() {
  const [busy, setBusy] = useState(false);
  async function reset() {
    if (!confirm("Reset all locally created cases? The demo case will be re-seeded.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      alert(data.message ?? "Done");
      location.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={reset} disabled={busy} className="rounded-lg border border-case-red/50 px-4 py-2 text-sm text-case-red transition hover:bg-case-red/10 disabled:opacity-50">
      {busy ? "Resetting…" : "Reset local data"}
    </button>
  );
}
