"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props { label: string; value: string; sub?: string; icon: ReactNode; delay?: number; }

export default function StatCard({ label, value, sub, icon, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-5 hover:border-violet-500/40 transition-all group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{label}</span>
        <span className="text-violet-400 opacity-70">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </motion.div>
  );
}
