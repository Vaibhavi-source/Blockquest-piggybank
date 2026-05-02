# 🐷 PiggyBank — On-Chain SOL Vault on Solana

> A non-custodial SOL savings vault built on **Solana Devnet** using the **Anchor framework**.  
> Each wallet gets its own on-chain PDA vault — deposit SOL in, withdraw it back out.  
> Every rule is enforced by the smart contract itself; there's no admin, no backend, no trust required.

<div align="center">

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-1.0.1-3E4ACB?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Tests](https://img.shields.io/badge/Tests-4%2F4%20Passing-22c55e?style=for-the-badge)

**Program ID:** `FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12`  
[View on Solana Explorer](https://explorer.solana.com/address/FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12?cluster=devnet)

</div>

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Real-World Analogy](#-real-world-analogy)
3. [Key Solana Concepts Used](#-key-solana-concepts-used)
4. [Architecture & How It Works](#-architecture--how-it-works)
5. [Folder Structure](#-folder-structure)
6. [Program Instructions](#-program-instructions)
7. [Account Layout](#-account-layout)
8. [Security & Ownership Enforcement (Bonus)](#-security--ownership-enforcement-bonus)
9. [Custom Errors](#-custom-errors)
10. [Prerequisites & Installation](#-prerequisites--installation)
11. [Step-by-Step Setup](#-step-by-step-setup)
12. [Running the Tests](#-running-the-tests)
13. [Test Suite Explained](#-test-suite-explained)
14. [Expected Test Output](#-expected-test-output)
15. [Deployment Details](#-deployment-details)
16. [Technical Deep-Dive](#-technical-deep-dive)
17. [Screenshots](#-screenshots)
18. [Live Terminal Logs](#-live-terminal-logs)
19. [Debugging Tips](#-debugging-tips)
20. [Resources](#-resources)
21. [Submission Checklist](#-submission-checklist)

---

## 🎯 Project Overview
This is a **Blockquest submission** — a Solana dApp that lets any wallet spin up its own personal SOL vault on-chain. Built with Anchor, it covers the full Solana programming model: account ownership, PDAs, CPI via `invoke`, and direct lamport mutation for program-owned accounts. A Next.js 14 frontend with Phantom wallet support makes it fully interactive from the browser.

| Item                    | Value                                              |
| ----------------------- | -------------------------------------------------- |
| **Network**             | Solana Devnet                                      |
| **Program ID**          | `FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12`    |
| **Framework**           | Anchor 1.0.1                                       |
| **Language (on-chain)** | Rust                                               |
| **Language (tests)**    | TypeScript                                         |
| **Test runner**         | Mocha                                              |
| **Frontend**            | Next.js 14 + @coral-xyz/anchor 0.32.1              |

---

## 🏦 Real-World Analogy

Think of it exactly like a ceramic piggy bank on your desk — but living permanently on the Solana blockchain:

| The Physical World        | What It Maps To on Solana                                                       |
| ------------------------- | ------------------------------------------------------------------------------- |
| Your ceramic piggy bank   | A **PDA account** — a special address owned and controlled by this program      |
| Your name on the bank     | Seeds `["piggybank", your_wallet_pubkey]` — your key uniquely derives your vault |
| Dropping a coin in        | Calling `deposit` — SOL flows from your wallet into the PDA                    |
| Coins sitting inside      | Lamports locked in the PDA's account balance                                    |
| Knowing it's yours        | The PDA address is deterministic — no one else can derive the same address      |
| The ceramic shell (rules) | The on-chain Anchor program — immutable after deployment                        |
| You walking to the bank   | The Next.js frontend building and signing the transaction via Phantom           |
| Bank staff processing it  | Solana validators running the program logic and updating state                  |
| Smashing it open          | Calling `withdraw` — SOL flows from the PDA back into your wallet              |

---

## 🔑 Key Solana Concepts Used

### Accounts
Solana stores everything — code, balances, and application data — in **accounts**. Each account has an owner program that controls writes to it. Three accounts are in play here:

- **User wallet** — owned by the System Program; holds the user's SOL
- **PDA vault** (`PiggyBank`) — owned by our deployed Anchor program; holds the saved SOL
- **System Program** — Solana's built-in program that handles SOL transfers between System-owned accounts

### Programs
Unlike Ethereum, Solana programs are **stateless** — they hold no data themselves. All state lives in separate accounts that the program reads and writes. Our program (`lib.rs`) defines three callable instructions and validates every account constraint before touching any lamports.

### Instructions
An instruction tells a program: "here are the accounts involved, here is the data, now execute." Multiple instructions can be packed into a single **transaction**, which is processed atomically — either everything succeeds or nothing changes.

### PDAs (Program Derived Addresses)
A PDA is computed as:

```
PDA = findProgramAddress(["piggybank", user_pubkey], program_id)
```

Three inputs go in — seeds, program ID, and a bump nonce. The result is an address that deliberately falls **off** the ed25519 curve, meaning it has no private key and cannot be signed for by any external wallet. Only our program, using `seeds` + `bump`, can authorize operations on it.

### Deposit vs Withdraw — Why Different Methods
|                       | `deposit`                                               | `withdraw`                                                              |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Who moves SOL**     | System Program, via CPI `invoke()`                      | Our program, via direct lamport mutation                                |
| **Why this method**   | User wallet is System Program-owned — it can sign       | PDA is program-owned — System Program has zero authority over it        |
| **Anchor helper used**| `system_instruction::transfer` + `invoke()`             | `try_borrow_mut_lamports()` on both accounts                            |

### Bump Seed Caching
Computing the canonical bump on-chain requires iterating from 255 downward until a valid off-curve address is found. We store the bump in the `PiggyBank` struct at init time so subsequent instructions can pass it in directly — saving compute units on every call.

---

## 🏗️ Architecture & How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Next.js 14)                         │
│  @solana/wallet-adapter + @coral-xyz/anchor                      │
│  anchor.methods.initialize() / deposit() / withdraw()            │
└────────────────────────────┬────────────────────────────────────┘
                             │ Transaction (JSON-RPC / devnet)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SOLANA DEVNET VALIDATOR                      │
│  Validates signatures, checks account ownership, runs program    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               OUR ANCHOR PROGRAM (lib.rs)                        │
│  Program ID: FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12       │
│                                                                  │
│  initialize ──► Creates PDA, stores owner + bump                 │
│  deposit    ──► invoke(System::transfer, user→PDA)               │
│  withdraw   ──► Direct lamport manipulation (PDA→user)           │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│  PiggyBank PDA Account        │
│  Seeds: ["piggybank", user]   │
│  Data:  { owner, bump }       │
│  Lamports: deposited SOL      │
└──────────────────────────────┘
```

### Transaction Flow — Deposit
```
User Wallet  ──[sign]──►  Transaction
                              │
                              ▼
                    System Program::transfer
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
       user_lamports -= amount        pda_lamports += amount
```

### Transaction Flow — Withdraw
```
Program signs for PDA via seeds  ──►  Transaction
                                           │
                                           ▼
                             Direct lamport manipulation
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
            pda_lamports -= amount                  user_lamports += amount
```

**Why can't another wallet withdraw?**

The PDA address is derived from `["piggybank", owner_pubkey]`. When a rogue wallet tries to sign a withdrawal:
1. Anchor computes the expected PDA using the signer's key → different address
2. `ConstraintSeeds` fails (error 2006) — the passed account ≠ computed address
3. Transaction is **rejected at consensus** — no lamports move

---

## 📁 Folder Structure

```
Blockquest-piggybank/
│
├── Anchor.toml                     # Cluster config (devnet), program ID, test script
├── Cargo.toml                      # Rust workspace config
├── package.json                    # JS dependencies (@coral-xyz/anchor, mocha)
├── tsconfig.json                   # TypeScript compiler config
├── README.md                       # This file
├── logs.ps1                        # Live log streaming script (PowerShell)
├── setup.bat                       # One-click Windows setup script
├── install-solana.ps1              # Solana CLI installer for Windows
├── .gitignore                      # Excludes target/, node_modules/, keypairs
│
├── programs/piggybank/
│   └── src/
│       └── lib.rs                  # ◄── ALL on-chain Rust program logic
│
├── tests/
│   └── piggybank.js                # ◄── All 4 JavaScript tests (Mocha)
│
├── screenshots/                    # App screenshots for README
│
├── target/                         # Auto-generated by `anchor build` — NOT committed
│   ├── deploy/piggybank.so         # Compiled BPF bytecode deployed to devnet
│   └── idl/piggybank.json          # Auto-generated Interface Definition Language
│
└── app/                            # Next.js 14 frontend
    └── src/
        ├── app/page.tsx            # Main page (3 states: hero / init / dashboard)
        ├── components/
        │   ├── Navbar.tsx
        │   ├── VaultVisual.tsx
        │   ├── DepositWithdrawPanel.tsx
        │   ├── TxFeed.tsx
        │   └── TerminalLog.tsx
        ├── hooks/usePiggyBank.ts   # Anchor client + state + log tracking
        ├── context/WalletContextProvider.tsx
        └── idl/piggybank.json      # IDL copy for frontend
```

---

## 🔧 Program Instructions

### 1. `initialize`
**What it does:** Spins up a brand-new PDA vault account tied to the calling wallet. One wallet = one vault, forever.

**Step by step:**
1. Anchor derives the PDA from seeds `[b"piggybank", owner.key().as_ref()]` + our program ID
2. The System Program allocates **41 bytes** of on-chain storage for the account
3. The `owner` pubkey and canonical `bump` are written into the account data
4. The calling wallet pays the **rent-exempt deposit** upfront (~0.00117624 SOL) — a one-time cost to keep the account alive indefinitely

**Accounts consumed:**
```
piggy_bank     — PDA being created (Anchor init constraint handles derivation)
owner          — signer and lamport payer
system_program — needed for the account creation CPI
```

> Calling this a second time with the same wallet fails immediately — Anchor's `init` constraint detects the account already exists and rejects the transaction.

---

### 2. `deposit(amount: u64)`
**What it does:** Moves SOL from the connected wallet into the PDA vault.

**Step by step:**
1. Rejects zero-amount calls at the instruction level
2. Issues a **CPI** to the System Program via `invoke()`, passing `system_instruction::transfer`
3. The System Program confirms the user signed the transaction, then deducts `amount` lamports from the wallet and credits them to the PDA

> `invoke()` is correct here because the user's wallet is System Program-owned — the user's signature is all the authorization needed.

---

### 3. `withdraw(amount: u64)`
**What it does:** Sends SOL from the PDA vault back to the owner's wallet.

**Step by step:**
1. Rejects zero-amount calls
2. Checks that `pda_balance - amount >= rent_exempt_minimum` — refuses to drain the account below survival threshold
3. Directly mutates the lamport fields on both accounts:

```rust
**ctx.accounts.piggy_bank.to_account_info().try_borrow_mut_lamports()? -= amount;
**ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += amount;
```

> Why not `invoke_signed`? The System Program only moves lamports for accounts it owns. Our PDA is owned by **our program**, so the System Program has no authority over it. Direct lamport mutation is the correct Anchor pattern for program-owned account withdrawals. Solana's runtime enforces conservation — lamports subtracted must equal lamports added, or the transaction fails.

**Rent guard:** If a withdrawal would push the PDA below the rent-exempt minimum, the instruction aborts. This prevents Solana's garbage collector from reclaiming the account.

---

## 📐 Account Layout

```rust
#[account]
pub struct PiggyBank {
    pub owner: Pubkey,  // 32 bytes
    pub bump:  u8,      //  1 byte
}
// Total: 8 (discriminator) + 32 + 1 = 41 bytes
// Rent-exempt minimum: ~0.00117624 SOL
```

```
Offset  Size   Field
──────────────────────────────────────────
0       8      Anchor account discriminator (auto-added)
8       32     owner: Pubkey  — wallet that created this bank
40      1      bump: u8       — canonical bump seed
──────────────────────────────────────────
Total   41 bytes
```

The discriminator is the first 8 bytes of every Anchor account — a SHA256 hash of `"account:PiggyBank"`. Anchor validates it on every instruction to ensure an account of type `PiggyBank` wasn't sneaked in where a different type was expected.

---

## 🛡️ Security & Ownership Enforcement (Bonus)

The `Withdraw` instruction enforces ownership at the **constraint level** — before a single line of instruction logic runs:

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
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

Two independent guards fire before any lamports move:

**Guard 1 — PDA re-derivation (`seeds` + `bump`):**  
Anchor re-computes the expected PDA using the `owner` key passed into the transaction. If an attacker submits their own pubkey as `owner`, the re-derived PDA address won't match the victim's vault address — Anchor immediately throws `ConstraintSeeds` (error 2006) and halts.

**Guard 2 — Stored owner field (`has_one`):**  
`has_one = owner` reads the `owner` field stored **inside** the PDA's account data and compares it to the transaction signer. Even in a hypothetical scenario where seeds somehow matched, this check catches any mismatch between the stored owner and the signer.

**Test 4 demonstrates the attack path:**
```
1. A fresh random keypair is generated (the attacker)
2. Attacker calls withdraw, passing our PDA as the vault
3. Anchor re-derives PDA using attacker's key → wrong address
4. → Transaction reverts: ConstraintSeeds (2006)
5. Our SOL is untouched
```

The rejection happens at the **Solana consensus layer** — not the frontend. Even a raw crafted transaction bypassing the UI hits the same wall.

---

## ❌ Custom Errors

| Error Code          | Anchor Code | Message                                                        |
| ------------------- | ----------- | -------------------------------------------------------------- |
| `ConstraintSeeds`   | 2006        | PDA re-derivation doesn't match provided account               |
| `InsufficientFunds` | Custom      | Withdrawal would violate rent-exemption                        |

---

## ⚙️ Prerequisites & Installation

| Tool               | Version Used  | Check Command       |
| ------------------ | ------------- | ------------------- |
| Rust (stable)      | 1.75+         | `cargo --version`   |
| Solana CLI         | v1.18+        | `solana --version`  |
| Anchor CLI (AVM)   | 1.0.1         | `anchor --version`  |
| Node.js            | 18+           | `node --version`    |
| npm                | 9+            | `npm --version`     |

> **Windows Users:** Use the included `setup.bat` or `install-solana.ps1` for a guided setup.

---

## 🚀 Step-by-Step Setup

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Blockquest-piggybank.git
cd Blockquest-piggybank
```

### 2. Install JavaScript dependencies
```bash
npm install
```

### 3. Configure Solana for Devnet
```bash
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json   # skip if you have a wallet
solana address    # shows your wallet public key
solana balance    # check your devnet SOL balance
```

### 4. Get devnet SOL (if balance is 0)
```bash
solana airdrop 2
# or use web faucets:
# https://faucet.solana.com
# https://faucet.quicknode.com/solana/devnet
```

### 5. Build the program
```bash
anchor build
# Compiles Rust → target/deploy/piggybank.so (~2-3 min first time)
```

### 6. Deploy to Devnet (already deployed — skip if using existing program)
```bash
anchor deploy --provider.cluster devnet
# Outputs: Program Id: FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12
```

### 7. Update Program ID (only if redeploying fresh)
If you get a new Program ID, update it in two places:

**`programs/piggybank/src/lib.rs`:**
```rust
declare_id!("YOUR_NEW_PROGRAM_ID");
```

**`Anchor.toml`:**
```toml
[programs.devnet]
piggybank = "YOUR_NEW_PROGRAM_ID"
```
Then rebuild: `anchor build`

### 8. Install frontend dependencies & start
```bash
cd app
npm install
npm run dev
# → http://localhost:3000
```

### 9. Watch live logs (separate PowerShell window)
```powershell
powershell -ExecutionPolicy Bypass -File logs.ps1
```

---

## 🧪 Running the Tests

```powershell
# Set environment variables (PowerShell)
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET       = "$env:USERPROFILE\.config\solana\id.json"

# Run all 4 tests
npx mocha -t 1000000 tests/piggybank.js
```

The `-t 1000000` flag sets a generous timeout since devnet confirmation can be slow.

---

## 🔍 Test Suite Explained

### Test 1 — Initialize
Derives the expected PDA client-side, then sends the `initialize` instruction. After confirmation, fetches the on-chain `PiggyBank` account and asserts the stored `owner` matches the test wallet's public key. If the account already existed from a prior run, the test detects this and simply re-verifies the owner — no redundant re-init.

### Test 2 — Deposit
Snapshots the PDA's lamport balance before the call, then deposits **0.1 SOL**. After the transaction confirms, re-reads the PDA balance and asserts it grew by exactly the deposited amount. This validates the CPI to the System Program is wired correctly.

### Test 3 — Withdraw
Snapshots the **user wallet** balance before the call, then withdraws **0.05 SOL** from the vault. After confirmation, asserts the wallet balance grew by approximately 0.05 SOL (within a small tolerance to account for the transaction fee). This validates the direct lamport manipulation path.

### Test 4 (Bonus) — Unauthorized Withdrawal Attempt
Generates a **brand-new random keypair** that has nothing to do with the vault owner. That keypair tries to call `withdraw` on our PDA, passing itself as `owner`. The test asserts the transaction **throws** and that the error includes `ConstraintSeeds` or `2006`. The vault balance is then confirmed unchanged — proving the on-chain guard held.

---

## ✅ Expected Test Output

```
  piggybank
  ✓ Initializes the piggy bank (or verifies existing)  (438ms)
  ✓ Deposits 0.1 SOL and PDA balance increases         (865ms)
  ✓ Withdraws 0.05 SOL and user balance increases      (774ms)
  ✓ Unauthorized withdrawal fails with constraint error (185ms)

  4 passing (2s)
```

---

## 🌐 Deployment Details

| Field                 | Value                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Network**           | Solana Devnet                                                                                                                  |
| **Program ID**        | `FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12`                                                                                |
| **PDA Seeds**         | `["piggybank", owner_pubkey]`                                                                                                  |
| **Account Size**      | 41 bytes (8 discriminator + 32 pubkey + 1 bump)                                                                                |
| **Rent-exempt Min**   | ~0.00117624 SOL                                                                                                                |
| **Withdraw Method**   | Direct lamport manipulation (`try_borrow_mut_lamports`)                                                                        |
| **Access Control**    | `has_one = owner` + `ConstraintSeeds`                                                                                          |
| **Explorer Link**     | [View on Solana Explorer](https://explorer.solana.com/address/FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12?cluster=devnet)    |

---

## 🔬 Technical Deep-Dive

### Why a PDA Can't Be Signed by Anyone
Solana key pairs live on the **ed25519 elliptic curve** — every valid private key has a corresponding public key on that curve. PDAs are derived by hashing seeds + program ID and then bumping a nonce until the result lands **off the curve**. No private key exists for that point, so no external wallet can ever sign for it. Our program is the only entity that can authorize PDA operations — by passing the original seeds at instruction time.

### Lamport Conservation
Solana's runtime runs a hard check after every instruction: **sum of lamports in == sum of lamports out** (modulo fees). This is why `try_borrow_mut_lamports` works — we subtract from the PDA and add the exact same amount to the user. The runtime accepts it. Any mismatch, even by 1 lamport, causes the entire transaction to fail. This makes direct lamport mutation safe without needing the System Program.

### Rent Exemption & The Withdraw Floor
Every Solana account pays storage rent proportional to its byte size — unless it holds enough lamports to be permanently "rent-exempt." For our 41-byte `PiggyBank` account, that floor is ~0.00117624 SOL. If an account drops below this level, validators will eventually reclaim it and all data is lost. Our `withdraw` instruction enforces `remaining_balance >= rent_exempt_min` before proceeding — the vault account survives even if fully "emptied" by the user.

### Anchor Discriminators & Type Safety
Anchor writes an 8-byte discriminator at byte offset 0 of every `#[account]`-decorated struct. It's computed as `sha256("account:PiggyBank")[0..8]`. On every subsequent instruction, Anchor re-computes and validates this value before deserializing account data. This blocks attacks where an adversary substitutes a different account type — the discriminator check fires before any instruction logic.

### Version Stack Used
```
Solana CLI:         v1.18+
Anchor CLI:         1.0.1
anchor-lang:        1.0.1 (Rust crate)
@coral-xyz/anchor:  0.32.1 (JS package)
Node.js:            18+
Next.js:            14
```

---

## 📸 Screenshots

### 1. Landing Page
Connect your Phantom wallet to get started. The hero explains exactly what a PDA vault is and why it's more secure than a regular wallet.

![Landing Page](screenshots/01_landing.png)

---

### 2. Wallet Connection
Click **Select Wallet** — Phantom is auto-detected. One click and you're in.

![Wallet Connect](screenshots/02_wallet_connect.png)

---

### 3. Live Dashboard — Active Vault
Once connected and initialized, the dashboard shows your vault balance, deposit/withdraw panel, and full transaction history.

![Dashboard](screenshots/03_dashboard.png)

---

### 4. Solana Live Logs — Terminal Output
A dedicated PowerShell window streams every on-chain instruction in real time using `solana logs`. Here you can see `Initialize`, `Deposit`, and `Withdraw` instructions firing with their compute units and transaction signatures.

> *Auto-reconnects on WebSocket timeout — no manual action needed.*

![Live Logs 1](screenshots/04_terminal_logs_1.png)
![Live Logs 2](screenshots/05_terminal_logs_2.png)

---

## 📡 Live Terminal Logs

The `logs.ps1` script streams every on-chain instruction as it executes:

```powershell
powershell -ExecutionPolicy Bypass -File logs.ps1
```

**What you'll see:**
```
[09:12:34] Streaming...
Transaction executed in slot 459490740:
  Signature: 2cpD2HazbLE8acMspxXaAv2SHhVePsPLwR7oUb1r85S6...
  Status: Ok
  Log Messages:
    Program FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12 invoke [1]
    Program log: Instruction: Initialize
    Program 11111111111111111111111111111111 invoke [2]
    Program 11111111111111111111111111111111 success
    Program FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12 consumed 9500 of 199700 compute units
    Program FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12 success

Transaction executed in slot 459490860:
    Program log: Instruction: Deposit
    ...consumed 5491 of 199700 compute units
    Program FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12 success
```

---

## 🔍 Debugging Tips

**Useful commands while developing:**
```powershell
# Tail all logs for this specific program (filter out noise from other programs)
solana logs FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12

# Or use the included script which auto-reconnects on timeout:
powershell -ExecutionPolicy Bypass -File logs.ps1

# Paste any tx signature into Explorer to see full instruction trace:
# https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet

# Check wallet balance before running tests
solana balance
```

**Common errors and fixes:**

| What you see | What it means | How to fix it |
|---|---|---|
| `Blockhash not found` | Blockhash expired before tx sent | Retry — or set `skipPreflight: true` |
| `Custom program error: 0x0` on initialize | PDA already exists from a previous run | This is fine — the test auto-skips and re-verifies |
| `airdrop failed` | Devnet faucet rate-limited your IP | Use [faucet.solana.com](https://faucet.solana.com) in browser |
| `ConstraintSeeds (2006)` | The signer's key doesn't derive to the vault address | Make sure you're connected with the **same wallet** that initialized the vault |
| Frontend shows stale balance | RPC cache lag | Wait 2-3 seconds and refresh — devnet can lag |

---

## 📚 Resources
- [Anchor Documentation](https://www.anchor-lang.com)
- [Anchor PDA Reference](https://www.anchor-lang.com/docs/pdas)
- [Solana Docs — Programming Model](https://docs.solana.com/developing/programming-model/overview)
- [Solana Docs — Accounts](https://docs.solana.com/developing/programming-model/accounts)
- [Solana Docs — Calling Between Programs (CPI)](https://docs.solana.com/developing/programming-model/calling-between-programs)
- [Solana Cookbook — PDAs](https://solanacookbook.com/core-concepts/pdas.html)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

---

## 📋 Submission Checklist
- [x] GitHub repository containing `programs/`, `tests/`, config files
- [x] Program deployed on Solana Devnet
- [x] Program ID correctly set in `declare_id!()` in `lib.rs`
- [x] Program ID correctly set in `Anchor.toml` under `[programs.devnet]`
- [x] **Test 1** — `initialize` passes ✔
- [x] **Test 2** — `deposit` passes ✔
- [x] **Test 3** — `withdraw` passes ✔
- [x] **Test 4 (Bonus)** — unauthorized withdrawal rejected ✔
- [x] All 4 tests passing: `4 passing` with no failures
- [x] `target/` excluded from git via `.gitignore`
- [x] Keypair files excluded from git via `.gitignore`
- [x] Next.js 14 frontend deployed and functional
- [x] Live terminal log streaming via `logs.ps1`
- [x] Screenshots included in `screenshots/`

---

<div align="center">
Built for Blockquest · Solana Devnet · Anchor Framework
</div>
