"use client";
import { TxRecord } from "@/hooks/usePiggyBank";
import { BoltIcon, ExternalLinkIcon } from "./icons";

interface Props { txHistory: TxRecord[]; }

function timeAgo(ts: number | null | undefined): string {
  if (!ts) return "pending";
  const diff = Date.now() / 1000 - ts;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function TxFeed({ txHistory }: Props) {
  if (!txHistory.length) return (
    <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[240px]">
      <div className="w-10 h-10 rounded-xl bg-violet-900/20 flex items-center justify-center mb-3">
        <BoltIcon size={18} className="text-violet-500/50" />
      </div>
      <p className="text-gray-500 text-sm">No transactions yet</p>
      <p className="text-gray-600 text-xs mt-1">Deposit SOL to get started</p>
    </div>
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
        <span className="text-sm font-medium text-gray-300">Transaction History</span>
        <span className="ml-auto text-xs text-gray-600 font-mono-data">{txHistory.length}</span>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {txHistory.map(tx => (
          <a key={tx.signature}
            href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
            target="_blank" rel="noopener"
            className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-all duration-150 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-violet-900/30 flex items-center justify-center">
                <BoltIcon size={13} className="text-violet-400/70" />
              </div>
              <div>
                <p className="text-xs text-gray-300 font-mono-data truncate w-40 group-hover:text-violet-400 transition-colors duration-150">
                  {tx.signature.slice(0, 20)}…
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">Slot {tx.slot.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-600">{timeAgo(tx.blockTime)}</span>
              <ExternalLinkIcon size={12} className="text-gray-700 group-hover:text-violet-400 transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
