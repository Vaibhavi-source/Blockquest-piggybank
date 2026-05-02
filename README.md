# 🐷 PiggyBank — On-Chain SOL Vault on Solana

> A fully on-chain, non-custodial savings vault built with **Anchor** on **Solana Devnet**. Only the wallet that initialized the vault can ever withdraw from it — enforced by smart-contract constraints, not trust.

<div align="center">

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-1.0.1-3E4ACB?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Tests](https://img.shields.io/badge/Tests-4%2F4%20Passing-22c55e?style=for-the-badge)

**Program ID:** `FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12`  
[View on Explorer](https://explorer.solana.com/address/FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12?cluster=devnet)

</div>

---

## 📸 Screenshots

### 1. Landing Page — Connect Wallet
> Hero with feature cards explaining what PDA vaults are and how they differ from regular wallets

![Landing Page](screenshots/01_landing.png)

---

### 2. Initialize Vault
> After connecting Phantom (Devnet), one-time vault creation derives a PDA from your wallet address

![Initialize Vault](screenshots/02_initialize.png)

---

### 3. Dashboard — Active Vault
> Full dashboard showing vault balance, deposit/withdraw panel, transaction history, and security demo

![Dashboard](screenshots/03_dashboard.png)

---

### 4. Terminal Activity Log — Live Checkmarks
> Real-time log panel showing each step with ✅ checkmarks, timestamps, and clickable explorer links

![Terminal Log](screenshots/04_terminal_log.png)

---

### 5. Security Demo — Unauthorized Withdrawal Blocked
> Generating a random rogue wallet and attempting to steal SOL — rejected instantly by the on-chain constraint

![Security Demo](screenshots/05_security_demo.png)

---

### 6. Solana Live Logs — Terminal Output
> Running `solana logs <program-id>` in a separate terminal streams every on-chain transaction in real time

![Solana Logs](screenshots/06_solana_logs.png)

---

### 7. All 4 Tests Passing
> Mocha test suite showing Initialize, Deposit, Withdraw, and Unauthorized Withdrawal tests

![Tests Passing](screenshots/07_tests.png)

---

## 🏗️ Architecture

```
User Wallet (Phantom)
       │
       │  signs transactions
       ▼
┌─────────────────────────────┐
│     Next.js 14 Frontend     │
│  @solana/wallet-adapter     │
│  @coral-xyz/anchor (client) │
└────────────┬────────────────┘
             │  JSON-RPC (devnet)
             ▼
┌─────────────────────────────┐
│  Solana Devnet Blockchain   │
│                             │
│  Program: FU2A8c...        │
│  ┌──────────────────────┐  │
│  │   PDA Vault Account   │  │
│  │  owner: wallet.pubkey │  │
│  │  bump:  u8            │  │
│  │  seeds: ["piggybank", │  │
│  │          owner_pubkey]│  │
│  └──────────────────────┘  │
└─────────────────────────────┘
```

**Why can't another wallet withdraw?**

The PDA address is derived from `["piggybank", owner_pubkey]`. When a rogue wallet tries to sign a withdrawal:
1. Anchor computes the expected PDA using the signer's key → different address
2. `ConstraintSeeds` fails (error 2006) — the passed account ≠ computed address
3. Transaction is **rejected at consensus** — no lamports move

---

## 🔧 Smart Contract (`programs/piggybank/src/lib.rs`)

### Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize` | Creates a PDA vault account for the signer. One-time per wallet. |
| `deposit(amount)` | Transfers SOL from user wallet → PDA vault via System Program |
| `withdraw(amount)` | Transfers SOL from PDA vault → owner wallet using direct lamport manipulation |

### Account Structure

```rust
#[account]
pub struct PiggyBank {
    pub owner: Pubkey,  // 32 bytes
    pub bump:  u8,      //  1 byte
}
// Total: 8 (discriminator) + 32 + 1 = 41 bytes
```

### Access Control

```rust
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds  = [b"piggybank", owner.key().as_ref()],
        bump   = piggy_bank.bump,
        has_one = owner   // ← rejects any signer that isn't the vault owner
    )]
    pub piggy_bank: Account<'info, PiggyBank>,
    #[account(mut, signer)]
    pub owner: Signer<'info>,
    ...
}
```

---

## 🧪 Test Results

```
  piggybank
  ✓ Initializes the piggy bank (or verifies existing)  (438ms)
  ✓ Deposits 0.1 SOL and PDA balance increases         (865ms)
  ✓ Withdraws 0.05 SOL and user balance increases      (774ms)
  ✓ Unauthorized withdrawal fails with constraint error (185ms)

  4 passing (2s)
```

Run tests yourself:
```bash
# Set env vars
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET       = "$env:USERPROFILE\.config\solana\id.json"

# Run
npx mocha -t 1000000 tests/piggybank.js
```

---

## 📡 Live Terminal Logs

To see on-chain transactions in your terminal as you use the dApp:

```bash
# In a separate PowerShell window:
solana logs FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12

# Output when you deposit:
# Transaction executed in slot 380921432
#   Program FU2A8c... invoke [1]
#   Program log: Instruction: Deposit
#   Program 11111... invoke [2]     ← System transfer
#   Program 11111... success
#   Program FU2A8c... success

# Output when rogue tries to withdraw:
#   Program FU2A8c... invoke [1]
#   Program log: Instruction: Withdraw
#   Program log: AnchorError: ConstraintSeeds (2006)  ← BLOCKED
#   Program FU2A8c... failed
```

---

## 🚀 How to Run Locally

### Prerequisites
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor via AVM](https://www.anchor-lang.com/docs/installation) (v1.0.1)
- Node.js 18+ and Yarn

### 1. Install dependencies
```bash
yarn install
cd app && npm install
```

### 2. Configure devnet wallet
```bash
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2
```

### 3. Build & deploy (already deployed — skip if using existing program)
```bash
anchor build
anchor deploy --provider.cluster devnet
```

### 4. Run tests
```bash
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET       = "$env:USERPROFILE\.config\solana\id.json"
npx mocha -t 1000000 tests/piggybank.js
```

### 5. Start frontend
```bash
cd app
npm run dev
# → http://localhost:3000
```

### 6. Watch live logs (optional, separate terminal)
```bash
solana logs FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12
```

---

## 🎭 Security Demo Flow

1. **Connect Account 1** (your Phantom wallet) → Initialize + Deposit 0.1 SOL
2. **Switch to Account 2** in Phantom → Try to withdraw from Account 1's vault
3. Phantom shows: *"This transaction reverted during simulation"*
4. **Or**: Click "Try Unauthorized Withdrawal" in the dashboard — a random keypair is generated on-the-fly and the on-chain program rejects it with `ConstraintSeeds (2006)`

> 💡 The rejection happens at the **Solana consensus layer** — not the frontend. Even if you bypass the UI and craft a raw transaction, the program will reject it.

---

## 📁 Project Structure

```
Blockquest-piggybank/
├── programs/piggybank/src/lib.rs   ← Anchor smart contract
├── tests/piggybank.js              ← Mocha test suite (4 tests)
├── target/idl/piggybank.json       ← Generated IDL
├── Anchor.toml                     ← Anchor config (devnet)
└── app/                            ← Next.js 14 frontend
    └── src/
        ├── app/page.tsx            ← Main page (3 states)
        ├── components/
        │   ├── TerminalLog.tsx     ← Live activity terminal
        │   ├── DepositWithdrawPanel.tsx
        │   ├── TxFeed.tsx
        │   ├── VaultVisual.tsx
        │   └── Navbar.tsx
        ├── hooks/usePiggyBank.ts   ← Anchor client + log tracking
        ├── context/WalletContextProvider.tsx
        └── idl/piggybank.json      ← IDL copy for frontend
```

---

## 🔑 Key Technical Details

| Item | Value |
|------|-------|
| Program ID | `FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12` |
| Cluster | Solana Devnet |
| PDA Seeds | `["piggybank", owner_pubkey]` |
| Account Size | 41 bytes (8 discriminator + 32 pubkey + 1 bump) |
| Withdraw Method | Direct lamport manipulation (`try_borrow_mut_lamports`) |
| Access Control | `has_one = owner` + `ConstraintSeeds` |
| Error on Unauth | 2006 (ConstraintSeeds) |
| Frontend | Next.js 14 + @coral-xyz/anchor@0.32.1 |

---

<div align="center">
Built for Blockquest · Solana Devnet · Anchor Framework
</div>
