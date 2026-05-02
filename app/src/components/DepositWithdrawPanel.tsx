"use client";
import { useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon, ExternalLinkIcon } from "./icons";

interface Props {
  onDeposit: (sol: number) => Promise<string | undefined>;
  onWithdraw: (sol: number) => Promise<string | undefined>;
  loading: boolean;
  error: string | null;
  withdrawable: number; // lamports available above rent-exempt
}

export default function DepositWithdrawPanel({ onDeposit, onWithdraw, loading, error, withdrawable }: Props) {
  const [tab, setTab]         = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount]   = useState("");
  const [lastTx, setLastTx]   = useState<string | null>(null);

  const isDeposit = tab === "deposit";
  const withdrawableSol = withdrawable / LAMPORTS_PER_SOL;
  const amountNum = parseFloat(amount) || 0;
  const overWithdrawable = !isDeposit && amountNum > withdrawableSol && withdrawableSol > 0;
  const isDisabled = loading || !amount || amountNum <= 0 || overWithdrawable;

  const handleSubmit = async () => {
    const sol = parseFloat(amount);
    if (!sol || sol <= 0) return;
    setLastTx(null);
    const tx = isDeposit ? await onDeposit(sol) : await onWithdraw(sol);
    if (tx) { setLastTx(tx); setAmount(""); }
  };

  const setMax = () => {
    if (!isDeposit && withdrawableSol > 0) {
      setAmount(withdrawableSol.toFixed(6));
    }
  };

  return (
    <div className="glass-card p-6">
      {/* Tabs */}
      <div className="flex mb-5 bg-white/[0.03] rounded-xl p-1 gap-1">
        {(["deposit", "withdraw"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setLastTx(null); setAmount(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === t
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                : "text-gray-500 hover:text-gray-300"
            }`}>
            {t === "deposit"
              ? <><ArrowDownIcon size={14} /> Deposit</>
              : <><ArrowUpIcon size={14} /> Withdraw</>
            }
          </button>
        ))}
      </div>

      {/* Withdrawable hint */}
      {!isDeposit && (
        <div className="flex items-center justify-between mb-2">
          <label className="label-caps">Amount</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Available: <span className="text-emerald-400 font-mono">{withdrawableSol.toFixed(6)} SOL</span>
            </span>
            {withdrawableSol > 0 && (
              <button onClick={setMax} className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                MAX
              </button>
            )}
          </div>
        </div>
      )}
      {isDeposit && <label className="label-caps block mb-2">Amount</label>}

      {/* Amount input */}
      <div className="relative mb-4">
        <input
          type="number" min="0" step="0.001" placeholder="0.000"
          value={amount} onChange={e => setAmount(e.target.value)}
          className={`w-full bg-[#0D1117] border rounded-xl px-4 py-3.5 text-white text-lg font-mono-data placeholder-gray-700 focus:outline-none transition-all duration-200 ${
            overWithdrawable
              ? "border-red-500/50 focus:border-red-500/70"
              : "border-white/[0.06] focus:border-violet-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
          }`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">SOL</span>
      </div>

      {/* Rent warning */}
      {overWithdrawable && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mb-3 p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          ⚠ Max withdrawable is <strong>{withdrawableSol.toFixed(6)} SOL</strong>.
          The remaining {(1176240 / LAMPORTS_PER_SOL).toFixed(6)} SOL is reserved for rent exemption.
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && !overWithdrawable && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="text-rose-400 text-xs mb-3 truncate"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isDisabled}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
          isDisabled
            ? "bg-violet-900/30 text-gray-600 cursor-not-allowed border border-white/[0.03]"
            : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-px active:translate-y-0 border border-violet-500/30"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Processing…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            {isDeposit ? <ArrowDownIcon size={16} /> : <ArrowUpIcon size={16} />}
            {isDeposit ? `Deposit ${amount || "0"} SOL` : `Withdraw ${amount || "0"} SOL`}
          </span>
        )}
      </motion.button>

      {/* Success */}
      <AnimatePresence>
        {lastTx && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-4 p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircleIcon size={14} />
              Transaction confirmed
            </div>
            <a href={`https://explorer.solana.com/tx/${lastTx}?cluster=devnet`} target="_blank" rel="noopener"
              className="flex items-center gap-1 mt-2 text-violet-400 hover:text-violet-300 transition-colors text-xs truncate">
              View on Explorer
              <ExternalLinkIcon size={12} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
