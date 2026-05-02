import type { Metadata } from "next";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import WalletContextProvider from "@/context/WalletContextProvider";

export const metadata: Metadata = {
  title: "PiggyBank — Solana DeFi Vault",
  description: "Your personal on-chain SOL vault powered by Solana & Anchor. Deposit and withdraw SOL securely using your own PDA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative z-10">
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
