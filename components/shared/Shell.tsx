"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fingerprint, LogOut, X, FolderSearch, SearchCheck, Layers, FileBarChart, Settings2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  { label: "Investigate", href: "/investigate", icon: SearchCheck },
  { label: "Cases", href: "/cases", icon: FolderSearch },
  { label: "Evidence", href: "/evidence", icon: Layers },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Settings", href: "/settings", icon: Settings2 }
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function useAccount() {
  const [user, setUser] = useState<{ email: string | null; name: string | null; isGuest: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);
  return user;
}

function FloatingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAccount();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed bottom-24 right-5 z-50 w-64 border border-case-border bg-case-panel/98 p-2 shadow-evidence backdrop-blur-xl sm:bottom-28 sm:right-8"
          >
            <div className="border-b border-case-border px-3 py-2.5">
              {user && !user.isGuest ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate font-mono text-xs text-case-muted">
                    <User size={13} className="shrink-0 text-case-cyan" /> {user.name || user.email}
                  </span>
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      setOpen(false);
                      router.push("/dashboard");
                      router.refresh();
                    }}
                    className="shrink-0 text-case-muted hover:text-case-amber"
                    aria-label="Sign out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 font-mono text-xs text-case-amber">
                  <User size={13} /> Sign in to save your history
                </Link>
              )}
            </div>
            <div className="py-1.5">
              {nav.map((item, i) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 font-heading text-sm uppercase tracking-[.08em] transition ${active ? "text-case-amber" : "text-case-text hover:text-case-amber"}`}
                    >
                      <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center border border-case-amber/50 bg-case-panel text-case-amber shadow-evidence transition hover:brightness-110 sm:bottom-8 sm:right-8"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <Fingerprint size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <main className="grid-bg min-h-screen">
        <Link href="/dashboard" className="fixed left-4 top-4 z-30 flex items-center gap-2 sm:left-6 sm:top-6">
          <span className="font-display text-base tracking-[.08em] text-case-text/80 transition hover:text-case-amber sm:text-lg sm:tracking-[.1em]">SLEUTH</span>
        </Link>
        <PageTransition>{children}</PageTransition>
      </main>
      <FloatingNav />
    </div>
  );
}
