"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { VaultIcon } from "./icons";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3.5 transition-all duration-300 ${
        scrolled
          ? "bg-[#07080F]/90 backdrop-blur-xl border-b border-white/[0.04] shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-600/20">
          <VaultIcon size={16} className="text-white" />
        </div>
        <span className="font-semibold text-[15px] text-white tracking-tight">
          Piggy<span className="text-violet-400">Bank</span>
        </span>
      </div>
      {mounted && (
        <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500 !rounded-[10px] !text-sm !font-semibold !px-5 !py-2 !border !border-violet-500/30 !transition-all !duration-150" />
      )}
    </nav>
  );
}
