"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import VaultVisual from "@/components/VaultVisual";
import DepositWithdrawPanel from "@/components/DepositWithdrawPanel";
import TxFeed from "@/components/TxFeed";
import TerminalLog from "@/components/TerminalLog";
import { usePiggyBank } from "@/hooks/usePiggyBank";
import {
  LockIcon, BoltIcon, ShieldCheckIcon, WalletIcon,
  VaultIcon, ArrowDownIcon, FlaskIcon, BlockIcon,
  CheckCircleIcon, NetworkIcon, ListIcon, KeyIcon,
  CodeIcon, FingerprintIcon,
} from "@/components/icons";

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <LockIcon size={22} />,
    title: "What is a PDA Vault?",
    desc: "A Program Derived Address is a smart-contract account generated from your wallet's public key. No private key exists for it — only the program can move its SOL, and only on your command.",
    accent: "violet",
    iconBg: "bg-violet-900/25",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/10 hover:border-violet-500/20",
  },
  {
    icon: <BoltIcon size={22} />,
    title: "Different from a Wallet",
    desc: "Your regular wallet holds SOL directly and anyone with your seed phrase can drain it. A PDA vault adds a smart-contract layer — even if someone knows the vault address, they mathematically cannot withdraw.",
    accent: "blue",
    iconBg: "bg-blue-900/25",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/10 hover:border-blue-500/20",
  },
  {
    icon: <ShieldCheckIcon size={22} />,
    title: "On-Chain Access Control",
    desc: "The Anchor program enforces a `has_one = owner` constraint on every withdrawal. Any transaction signed by a different wallet is rejected at the consensus layer — no trust required.",
    accent: "emerald",
    iconBg: "bg-emerald-900/25",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/10 hover:border-emerald-500/20",
  },
];

const STEPS = [
  { step: "01", title: "Connect Wallet", desc: "Your Solana wallet becomes the owner key.", icon: <WalletIcon size={18} /> },
  { step: "02", title: "Initialize Vault", desc: "A PDA account is created on-chain, tied to your address.", icon: <VaultIcon size={18} /> },
  { step: "03", title: "Deposit SOL", desc: "SOL moves from your wallet into the smart-contract account.", icon: <ArrowDownIcon size={18} /> },
  { step: "04", title: "Withdraw Anytime", desc: "Only your signature can unlock and return the funds.", icon: <KeyIcon size={18} /> },
];

// ── Fade-in animation preset ──────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ── Security Demo ─────────────────────────────────────────────────────────────
function SecurityDemo({ pdaAddress, demoUnauthorized }: { pdaAddress: any; demoUnauthorized: () => Promise<any> }) {
  const [status, setStatus] = useState<"idle" | "running" | "blocked" | "error">("idle");
  const [rogueKey, setRogueKey] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const run = useCallback(async () => {
    setStatus("running");
    setErrMsg("");
    const result = await demoUnauthorized();
    if (result?.blocked) {
      setRogueKey(result.rogueKey);
      setErrMsg(result.error);
      setStatus("blocked");
    } else {
      setStatus("error");
    }
  }, [demoUnauthorized]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-rose-900/20 flex items-center justify-center">
          <FlaskIcon size={18} className="text-rose-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-[15px]">Security Demo</h3>
          <p className="text-xs text-gray-500 mt-0.5">Prove only you can withdraw</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        Generate a random wallet and attempt to steal SOL from your vault. The on-chain constraint will reject it instantly.
      </p>

      {status === "idle" && (
        <button
          onClick={run}
          className="w-full py-3 bg-rose-950/30 border border-rose-500/20 text-rose-400 rounded-xl font-medium hover:bg-rose-950/40 hover:border-rose-500/30 transition-all duration-200 text-sm flex items-center justify-center gap-2"
        >
          <BlockIcon size={16} />
          Try Unauthorized Withdrawal
        </button>
      )}

      {status === "running" && (
        <div className="flex items-center gap-3 py-3 justify-center text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Attempting theft…
        </div>
      )}

      {status === "blocked" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/25 border border-rose-500/20 rounded-xl">
            <BlockIcon size={18} className="text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-rose-400 font-semibold text-sm">Access Denied by Smart Contract</p>
              <p className="text-rose-300/50 text-xs mt-0.5">ConstraintSeeds / ConstraintHasOne</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-500 px-1">
            <p>Rogue wallet: <span className="font-mono-data text-gray-400">{rogueKey.slice(0,20)}…</span></p>
            <p className="flex items-center gap-1 text-emerald-400">
              <CheckCircleIcon size={12} />
              Your SOL is safe — 0 lamports moved
            </p>
          </div>
          <button onClick={() => setStatus("idle")} className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors duration-150">
            ← Reset demo
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Hero (disconnected) ───────────────────────────────────────────────────────
function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative overflow-hidden">
      {/* Atmospheric glow — single, restrained */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/[0.07] blur-[100px]" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center max-w-3xl mx-auto">
        <motion.div {...fadeUp}>
          <VaultVisual initialized={false} loading={false} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/[0.08] border border-violet-500/15 text-violet-300 text-xs font-medium mb-6 mt-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            Live on Solana Devnet
          </div>
          <h1 className="text-5xl sm:text-6xl heading-xl text-white leading-[1.08]">
            Your Personal<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              On-Chain Vault
            </span>
          </h1>
          <p className="mt-5 text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            A smart-contract piggy bank on Solana. Deposit SOL into a PDA you cryptographically own — and only you can ever withdraw it.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {mounted && <WalletMultiButton />}
          <a href="#how" className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200 flex items-center gap-1.5 group">
            How it works
            <ArrowDownIcon size={14} className="group-hover:translate-y-0.5 transition-transform duration-200" />
          </a>
        </motion.div>

        {/* Trust pills */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.45 }} className="mt-12 flex flex-wrap justify-center gap-2.5">
          {[
            { icon: <LockIcon size={12} />, label: "Non-custodial" },
            { icon: <BoltIcon size={12} />, label: "Solana Devnet" },
            { icon: <CodeIcon size={12} />, label: "Anchor Program" },
            { icon: <FingerprintIcon size={12} />, label: "PDA Ownership" },
          ].map(t => (
            <span key={t.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-white/[0.03] border border-white/[0.05] text-gray-400">
              <span className="text-violet-400/70">{t.icon}</span>
              {t.label}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.5 + i * 0.1 }}
            className={`p-6 glass-card ${f.borderColor} transition-all duration-200`}
          >
            <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
              <span className={f.iconColor}>{f.icon}</span>
            </div>
            <h3 className="font-semibold text-white text-[15px] mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* How it works */}
      <section id="how" className="px-6 pb-24 max-w-4xl mx-auto">
        <motion.div {...fadeUp} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl heading-lg text-white">How it works</h2>
          <p className="text-gray-500 mt-2.5 text-sm">Four steps. Fully on-chain. Zero trust required.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative p-5 glass-card text-center group"
            >
              <div className="text-3xl font-black text-violet-500/[0.12] mb-3 tracking-tight">{s.step}</div>
              <div className="w-8 h-8 rounded-lg bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-violet-400/60">{s.icon}</span>
              </div>
              <h4 className="font-medium text-white text-sm mb-1">{s.title}</h4>
              <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-14 text-center">
          {mounted && <WalletMultiButton />}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VaultIcon size={14} className="text-violet-500/50" />
            <span className="text-xs text-gray-600">PiggyBank · Built on Solana</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <a href="https://solana.com" target="_blank" rel="noopener" className="hover:text-gray-400 transition-colors">Solana</a>
            <span className="text-gray-800">·</span>
            <a href="https://www.anchor-lang.com" target="_blank" rel="noopener" className="hover:text-gray-400 transition-colors">Anchor</a>
            <span className="text-gray-800">·</span>
            <span>Devnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Initialize ────────────────────────────────────────────────────────────────
function InitializeSection({ onInit, loading, error }: { onInit: () => void; loading: boolean; error: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
      <motion.div {...fadeUp}>
        <VaultVisual initialized={false} loading={loading} />
      </motion.div>
      <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-8 text-3xl heading-lg text-white">
        Create Your Vault
      </motion.h2>
      <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="mt-2.5 text-gray-400 max-w-sm text-sm leading-relaxed">
        This deploys a PDA account on Solana Devnet derived from your wallet address. One-time setup — yours forever.
      </motion.p>

      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="mt-5 flex flex-col gap-2.5 text-xs text-gray-500">
        {[
          { icon: <FingerprintIcon size={12} />, text: "Derived from your public key" },
          { icon: <LockIcon size={12} />, text: "No private key — program-owned" },
          { icon: <ShieldCheckIcon size={12} />, text: "Only your signature can withdraw" },
        ].map(t => (
          <span key={t.text} className="flex items-center justify-center gap-2">
            <span className="text-emerald-400">{t.icon}</span>
            {t.text}
          </span>
        ))}
      </motion.div>

      <motion.button
        {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }}
        whileTap={{ scale: 0.98 }} onClick={onInit} disabled={loading}
        className="mt-8 px-12 py-4 bg-violet-600 text-white font-semibold rounded-2xl text-base hover:bg-violet-500 shadow-lg shadow-violet-600/25 hover:shadow-violet-500/30 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-violet-500/30 flex items-center gap-2"
      >
        {loading ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Initializing…</span>
        ) : (
          <><LockIcon size={18} /> Initialize Vault</>
        )}
      </motion.button>

      {error && (
        <div className="mt-4 max-w-sm p-3.5 bg-rose-950/30 border border-rose-500/20 rounded-xl text-rose-300 text-xs text-left break-all">
          {error}
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { balance, pdaAddress, loading, error, deposit, withdraw, txHistory, logs, demoUnauthorized, withdrawable } = usePiggyBank();
  const sol = (balance / LAMPORTS_PER_SOL).toFixed(4);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-5xl mx-auto">
      {/* Vault header */}
      <motion.div {...fadeUp} className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 glass-card">
        <div className="flex-shrink-0">
          <VaultVisual initialized={true} loading={loading} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold text-white">Your Vault</h2>
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">Active</span>
          </div>
          <p className="text-xs text-gray-600 font-mono-data mt-1.5 truncate">{pdaAddress?.toBase58()}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white font-mono-data">{sol}</p>
          <p className="text-xs text-gray-500 mt-0.5">SOL on devnet</p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Balance", value: `${sol} SOL`, icon: <VaultIcon size={18} />, iconBg: "bg-violet-900/20", iconColor: "text-violet-400" },
          { label: "Network", value: "Devnet", icon: <NetworkIcon size={18} />, iconBg: "bg-blue-900/20", iconColor: "text-blue-400" },
          { label: "Transactions", value: String(txHistory.length), icon: <ListIcon size={18} />, iconBg: "bg-emerald-900/20", iconColor: "text-emerald-400" },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.06 }}
            className="glass-card p-4 text-center">
            <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mx-auto mb-2.5`}>
              <span className={s.iconColor}>{s.icon}</span>
            </div>
            <p className="font-semibold text-white text-sm font-mono-data">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
          <DepositWithdrawPanel onDeposit={deposit} onWithdraw={withdraw} loading={loading} error={error} withdrawable={withdrawable} />
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
          <TxFeed txHistory={txHistory} />
        </motion.div>
      </div>

      {/* Security demo + Terminal — full width 2 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-0">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }}>
          <SecurityDemo pdaAddress={pdaAddress} demoUnauthorized={demoUnauthorized} />
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }}>
          <TerminalLog logs={logs} />
        </motion.div>
      </div>


      {/* How it works mini */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }}
        className="mt-6 p-5 glass-card">
        <h4 className="text-sm font-medium text-white mb-3.5">How your vault works</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="flex gap-2.5">
            <FingerprintIcon size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <span><strong className="text-white font-medium">PDA derivation:</strong> seeds = ["piggybank", your_pubkey] — mathematically unique to you</span>
          </div>
          <div className="flex gap-2.5">
            <LockIcon size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <span><strong className="text-white font-medium">Program-owned:</strong> the smart contract holds the account, not a private key</span>
          </div>
          <div className="flex gap-2.5">
            <ShieldCheckIcon size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <span><strong className="text-white font-medium">has_one guard:</strong> every withdrawal is verified by the Anchor program on-chain</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { connected, publicKey: walletPubkey } = useWallet();
  const wallet = { publicKey: walletPubkey };
  const { initialized, loading, initializePiggyBank, error } = usePiggyBank();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        {!connected || !wallet.publicKey ? (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <HeroSection />
          </motion.div>
        ) : !initialized ? (
          <motion.div key="init" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <InitializeSection onInit={initializePiggyBank} loading={loading} error={error} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
