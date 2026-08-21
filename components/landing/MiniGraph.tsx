"use client";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface NodeDef {
  id: string;
  t: string;
  x: string;
  y: string;
  color: string;
}

const nodes: NodeDef[] = [
  { id: "source", t: "SOURCE", x: "6%", y: "18%", color: "#4fc3f7" },
  { id: "claim", t: "WHAT THEY SAID", x: "38%", y: "6%", color: "#f2efe6" },
  { id: "study", t: "STUDY", x: "12%", y: "62%", color: "#35d08b" },
  { id: "evidence", t: "EVIDENCE", x: "48%", y: "50%", color: "#f6a83b" },
  { id: "verdict", t: "THE ANSWER", x: "72%", y: "26%", color: "#4fc3f7" },
  { id: "action", t: "WHAT TO DO", x: "68%", y: "72%", color: "#8b98a5" }
];

const links: { from: string; to: string; d: string; color: string; delay: number; broken?: boolean }[] = [
  { from: "source", to: "claim", d: "M 70 75 C 160 30 250 60 330 60", color: "#4fc3f7", delay: 0.7 },
  { from: "study", to: "evidence", d: "M 100 230 C 200 190 270 190 380 195", color: "#35d08b", delay: 1.0 },
  { from: "evidence", to: "claim", d: "M 380 195 C 340 160 300 120 330 60", color: "#f6a83b", delay: 1.3, broken: true },
  { from: "claim", to: "verdict", d: "M 330 60 C 480 40 560 70 620 95", color: "#4fc3f7", delay: 1.6 },
  { from: "verdict", to: "action", d: "M 620 95 C 600 190 590 250 560 270", color: "#8b98a5", delay: 1.9 }
];

export function MiniGraph() {
  return (
    <div className="relative h-[340px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 340" fill="none">
        {links.map((link) => (
          <g key={`${link.from}-${link.to}`}>
            <path d={link.d} stroke={link.color} strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="5 6" />
            <motion.path
              d={link.d}
              stroke={link.color}
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: link.delay, ease: "easeOut" }}
            />
          </g>
        ))}
        {/* travelling signal on the contradiction link */}
        <motion.circle
          r="3.5"
          fill="#f6a83b"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: "linear" }}
          style={{ offsetPath: `path('M 100 230 C 200 190 270 190 380 195')` }}
        />
      </svg>

      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
          className="absolute rounded-xl border bg-case-panel2 px-4 py-3 font-mono text-xs shadow-evidence"
          style={{ left: node.x, top: node.y, borderColor: `${node.color}55`, color: node.color }}
        >
          {node.t}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3 }}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-case-green/40 bg-case-green/10 px-3 py-2 text-xs text-case-green"
      >
        <ShieldCheck size={14} /> Answer, backed by real evidence
      </motion.div>
    </div>
  );
}
