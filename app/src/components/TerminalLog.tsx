"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogEntry } from "@/hooks/usePiggyBank";

const STEP_LABELS: Record<number, string> = {
  1: "CONNECT",
  2: "INIT   ",
  3: "DEPOSIT",
  4: "WITHDRAW",
  0: "INFO   ",
};

const STATUS_ICON: Record<string, string> = {
  ok:      "✅",
  err:     "❌",
  pending: "⏳",
  warn:    "⚠️ ",
};

const STATUS_COLOR: Record<string, string> = {
  ok:      "text-emerald-400",
  err:     "text-red-400",
  pending: "text-yellow-400",
  warn:    "text-orange-400",
};

const STEP_COLORS: Record<number, string> = {
  1: "text-violet-400",
  2: "text-blue-400",
  3: "text-emerald-400",
  4: "text-pink-400",
  0: "text-gray-500",
};

// Progress tracker at top
const STEPS = [
  { n: 1, label: "Connect Wallet" },
  { n: 2, label: "Init Vault" },
  { n: 3, label: "Deposit SOL" },
  { n: 4, label: "Withdraw SOL" },
];

function getCompletedSteps(logs: LogEntry[]): Set<number> {
  const done = new Set<number>();
  for (const l of logs) {
    if (l.step > 0 && l.status === "ok") done.add(l.step);
  }
  return done;
}

interface Props {
  logs: LogEntry[];
}

export default function TerminalLog({ logs }: Props) {
  const done = getCompletedSteps(logs);

  return (
    <div className="glass-card border border-white/5 overflow-hidden">
      {/* Step tracker header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-xs text-gray-500 font-mono">piggybank — activity log</span>
          </div>
          <span className="text-xs text-gray-600 font-mono">devnet</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mt-2">
          {STEPS.map((s, i) => {
            const isDone = done.has(s.n);
            const isNext = !isDone && [...done].every(d => d < s.n) && (s.n === 1 || done.has(s.n - 1) || done.size === 0);
            return (
              <div key={s.n} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all flex-1 justify-center
                  ${isDone ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                    isNext ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" :
                    "bg-white/3 text-gray-600 border border-white/5"}`}>
                  {isDone ? "✅" : isNext ? "▶" : "○"}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.n}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-3 h-px flex-shrink-0 ${isDone ? "bg-emerald-500/50" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 h-52 overflow-y-auto font-mono text-xs space-y-1 bg-[#080b14]"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a4a transparent" }}>

        {logs.length === 0 && (
          <div className="text-gray-600 flex items-center gap-2">
            <span className="animate-pulse">█</span>
            <span>Waiting for activity…</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {logs.map(log => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 leading-relaxed"
            >
              {/* Timestamp */}
              <span className="text-gray-700 flex-shrink-0">[{log.time}]</span>

              {/* Step tag */}
              {log.step > 0 && (
                <span className={`flex-shrink-0 font-bold ${STEP_COLORS[log.step]}`}>
                  STEP {log.step}
                </span>
              )}

              {/* Status icon */}
              <span className="flex-shrink-0">{STATUS_ICON[log.status]}</span>

              {/* Label */}
              <span className={`${STATUS_COLOR[log.status]} flex-1`}>{log.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Clickable tx links */}
        {logs.filter(l => l.detail && l.detail.length > 40).slice(-3).map(log => (
          <motion.div key={`link-${log.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-4">
            <span className="text-gray-700">↳</span>
            <a
              href={`https://explorer.solana.com/tx/${log.detail}?cluster=devnet`}
              target="_blank" rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2 truncate max-w-[240px]"
            >
              {log.detail?.slice(0, 22)}…
            </a>
            <span className="text-gray-700">↗ explorer</span>
          </motion.div>
        ))}

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 text-gray-700 mt-1">
          <span>$</span>
          <span className="w-2 h-3 bg-violet-500/60 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}
