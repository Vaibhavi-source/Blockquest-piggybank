"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/programId";
import idlJson from "@/idl/piggybank.json";

const idl = idlJson as any;

// Rent-exempt minimum for a 41-byte PDA account on Solana
const RENT_EXEMPT_MIN = 1_176_240; // lamports (= 0.00117624 SOL)

export interface TxRecord {
  signature: string;
  slot: number;
  blockTime: number | null | undefined;
}

export type LogStatus = "ok" | "err" | "pending" | "warn";
export interface LogEntry {
  id: number;
  time: string;
  step: number;      // 1-4 (0 = meta/info)
  label: string;
  detail?: string;   // tx sig or address
  status: LogStatus;
}

let _logId = 0;
function makeLog(step: number, label: string, status: LogStatus, detail?: string): LogEntry {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { id: _logId++, time, step, label, detail, status };
}

export function usePiggyBank() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [pdaAddress, setPdaAddress] = useState<PublicKey | null>(null);
  const [balance, setBalance]       = useState<number>(0);
  const [withdrawable, setWithdrawable] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  const [txHistory, setTxHistory]   = useState<TxRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [logs, setLogs]             = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev.slice(-49), entry]); // keep last 50
  }, []);

  // Reset all state whenever wallet changes (disconnect OR switch account)
  useEffect(() => {
    if (!wallet.publicKey) {
      setPdaAddress(null);
      setInitialized(false);
      setBalance(0);
      setWithdrawable(0);
      setTxHistory([]);
      return;
    }
    // New wallet connected — reset first, then derive PDA
    setInitialized(false);
    setBalance(0);
    setWithdrawable(0);
    setTxHistory([]);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("piggybank"), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );
    setPdaAddress(pda);
    addLog(makeLog(1, `Wallet connected`, "ok", wallet.publicKey.toBase58()));
    addLog(makeLog(0, `PDA derived → ${pda.toBase58().slice(0,20)}…`, "ok"));
  }, [wallet.publicKey]); // eslint-disable-line

  const getProgram = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    return new Program(idl, provider);
  }, [connection, wallet]);

  const fetchBalance = useCallback(async () => {
    if (!pdaAddress) return;
    try {
      const info = await connection.getAccountInfo(pdaAddress);
      if (info) {
        setBalance(info.lamports);
        setWithdrawable(Math.max(0, info.lamports - RENT_EXEMPT_MIN));
        setInitialized(true);
      } else {
        setBalance(0); setWithdrawable(0); setInitialized(false);
      }
    } catch { /* ignore */ }
  }, [connection, pdaAddress]);

  const fetchTxHistory = useCallback(async () => {
    if (!pdaAddress) return;
    try {
      const sigs = await connection.getSignaturesForAddress(pdaAddress, { limit: 10 });
      setTxHistory(sigs.map(s => ({ signature: s.signature, slot: s.slot, blockTime: s.blockTime })));
    } catch { /* ignore */ }
  }, [connection, pdaAddress]);

  useEffect(() => {
    fetchBalance();
    fetchTxHistory();
    const id = setInterval(() => { fetchBalance(); fetchTxHistory(); }, 10000);
    return () => clearInterval(id);
  }, [fetchBalance, fetchTxHistory]);

  // Step 2 — initialize
  const initializePiggyBank = useCallback(async () => {
    const program = getProgram();
    if (!program || !wallet.publicKey || !pdaAddress) return;
    setLoading(true); setError(null);
    addLog(makeLog(2, "Initializing vault…", "pending"));
    try {
      const tx = await program.methods
        .initialize()
        .accounts({ piggyBank: pdaAddress, user: wallet.publicKey, systemProgram: SystemProgram.programId })
        .rpc({ skipPreflight: false });
      addLog(makeLog(2, "Vault initialized ✓", "ok", tx));
      await fetchBalance();
      await fetchTxHistory();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      addLog(makeLog(2, "Init failed", "err", msg.slice(0, 80)));
      setError(msg);
    } finally { setLoading(false); }
  }, [getProgram, wallet.publicKey, pdaAddress, fetchBalance, fetchTxHistory, addLog]);

  // Step 3 — deposit
  const deposit = useCallback(async (sol: number) => {
    const program = getProgram();
    if (!program || !wallet.publicKey || !pdaAddress) return;
    setLoading(true); setError(null);
    addLog(makeLog(3, `Depositing ${sol} SOL…`, "pending"));
    try {
      const tx = await program.methods
        .deposit(new BN(sol * LAMPORTS_PER_SOL))
        .accounts({ piggyBank: pdaAddress, user: wallet.publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addLog(makeLog(3, `Deposited ${sol} SOL ✓`, "ok", tx));
      await fetchBalance(); await fetchTxHistory();
      return tx;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      addLog(makeLog(3, "Deposit failed", "err", msg.slice(0, 80)));
      setError(msg);
    } finally { setLoading(false); }
  }, [getProgram, wallet.publicKey, pdaAddress, fetchBalance, fetchTxHistory, addLog]);

  // Step 4 — withdraw
  const withdraw = useCallback(async (sol: number) => {
    const program = getProgram();
    if (!program || !wallet.publicKey || !pdaAddress) return;
    setLoading(true); setError(null);
    addLog(makeLog(4, `Withdrawing ${sol} SOL…`, "pending"));
    try {
      const tx = await program.methods
        .withdraw(new BN(sol * LAMPORTS_PER_SOL))
        .accounts({ piggyBank: pdaAddress, owner: wallet.publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addLog(makeLog(4, `Withdrew ${sol} SOL ✓`, "ok", tx));
      await fetchBalance(); await fetchTxHistory();
      return tx;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      addLog(makeLog(4, "Withdraw failed", "err", msg.slice(0, 80)));
      setError(msg);
    } finally { setLoading(false); }
  }, [getProgram, wallet.publicKey, pdaAddress, fetchBalance, fetchTxHistory, addLog]);

  // Security demo — unauthorized withdraw attempt
  const demoUnauthorized = useCallback(async () => {
    const program = getProgram();
    if (!program || !pdaAddress) return null;
    const { Keypair } = await import("@solana/web3.js");
    const rogue = Keypair.generate();
    addLog(makeLog(0, `🎭 Rogue wallet: ${rogue.publicKey.toBase58().slice(0, 16)}…`, "warn"));
    addLog(makeLog(0, "Attempting unauthorized withdrawal…", "pending"));
    try {
      await program.methods
        .withdraw(new BN(0.001 * LAMPORTS_PER_SOL))
        .accounts({ piggyBank: pdaAddress, owner: rogue.publicKey, systemProgram: SystemProgram.programId })
        .signers([rogue])
        .rpc();
      return null;
    } catch (e: any) {
      addLog(makeLog(0, "🚫 BLOCKED — ConstraintSeeds / has_one violated", "err"));
      addLog(makeLog(0, "✓ 0 lamports moved. Vault is safe.", "ok"));
      return { blocked: true, rogueKey: rogue.publicKey.toBase58(), error: e?.message ?? String(e) };
    }
  }, [getProgram, pdaAddress, addLog]);

  return {
    pdaAddress, balance, withdrawable, initialized, txHistory, logs,
    loading, error, initializePiggyBank, deposit, withdraw,
    fetchBalance, fetchTxHistory, demoUnauthorized,
  };
}
