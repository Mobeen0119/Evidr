"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSearch, AlertCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center grid-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-case-cyan/40 bg-case-cyan/10 shadow-evidence">
            <FileSearch size={20} className="text-case-cyan" />
          </span>
          <span className="font-mono text-xl font-semibold tracking-[.22em]">SLEUTH</span>
        </div>
        <form onSubmit={onSubmit} className="rounded-2xl border border-case-border bg-case-panel/86 p-6 shadow-evidence">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-case-muted">Your investigations are private to your account.</p>

          <div className="mt-5">
            <GoogleSignInButton />
          </div>
          <div className="my-4 flex items-center gap-3 text-xs text-case-muted">
            <span className="h-px flex-1 bg-case-border" /> or <span className="h-px flex-1 bg-case-border" />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-case-red/40 bg-case-red/10 px-3 py-2 text-sm text-case-red">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-case-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-case-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-case-cyan"
            placeholder="you@example.com"
          />

          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-case-muted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-case-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-case-cyan"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-case-cyan px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-case-muted">
            No account?{" "}
            <Link href="/register" className="text-case-cyan hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
