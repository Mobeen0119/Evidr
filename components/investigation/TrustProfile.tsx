"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Card, Badge } from "@/components/ui/Card";
import type { TrustProfile as Trust } from "@/types/investigation";

const rows: [keyof Trust, string][] = [
  ["sourceAuthority", "Source authority"],
  ["evidenceQuality", "Evidence quality"],
  ["claimSupport", "Claim support"],
  ["transparency", "Transparency"],
  ["independentSupport", "Independent support"]
];

function AnimatedValue({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 70, damping: 20 });
  const ref = useRef<HTMLSpanElement>(null);
  const text = useTransform(spring, (v) => `${Math.round(v)}`);
  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);
  useEffect(() => {
    const unsub = text.on("change", (latest) => {
      if (ref.current) ref.current.textContent = latest;
    });
    return unsub;
  }, [text]);
  return <span ref={ref}>0</span>;
}

const toneFor = (level: Trust["syntheticSignals"]) =>
  level === "detected" ? "red" : level === "moderate" ? "amber" : level === "low" ? "amber" : "green";

export function TrustProfile({ profile }: { profile: Trust }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-sm uppercase tracking-[.22em] text-case-muted">Trust Check</h2>
        <Badge tone={profile.contradictions ? "amber" : "green"}>{profile.contradictions} contradiction{profile.contradictions === 1 ? "" : "s"}</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {rows.map(([key, label]) => {
          const value = Number(profile[key]);
          return (
            <div key={key} className="rounded-xl border border-case-border bg-black/20 p-3">
              <div className="text-xs uppercase text-case-muted">{label}</div>
              <div className="mt-2 flex items-end gap-1">
                <span className="font-mono text-2xl">
                  <AnimatedValue value={value} />
                </span>
                <span className="mb-1 text-xs text-case-muted">/100</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-case-cyan"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-case-border bg-black/20 p-4 text-sm">
        <span className="text-xs uppercase tracking-widest text-case-muted">Writing style</span>
        <Badge tone={toneFor(profile.syntheticSignals)}>{profile.syntheticSignals.toUpperCase()}</Badge>
        <span className="text-case-muted">a rough guess only — not proof of AI writing.</span>
      </div>
      <div className="mt-3 rounded-xl border border-case-border bg-black/20 p-4 text-sm leading-6 text-case-muted">
        <span className="text-case-text">In short: </span>
        {profile.conclusion}
      </div>
    </Card>
  );
}
