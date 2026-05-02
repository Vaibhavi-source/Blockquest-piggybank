const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } = require("@solana/web3.js");
const { assert } = require("chai");

const idl = require("../target/idl/piggybank.json");
const PROGRAM_ID = new PublicKey("FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12");

describe("piggybank", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, provider);
  const user = provider.wallet;

  const [piggyBankPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("piggybank"), user.publicKey.toBuffer()],
    PROGRAM_ID
  );

  // ── Test 1: Initialize (idempotent) ──────────────────────────────────────
  it("Initializes the piggy bank (or verifies existing)", async () => {
    // Check if already initialized from a previous test run
    const existing = await provider.connection.getAccountInfo(piggyBankPda);

    if (existing) {
      console.log("  PDA already initialized — verifying state...");
    } else {
      const tx = await program.methods
        .initialize()
        .accounts({
          piggyBank:     piggyBankPda,
          user:          user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("  Init tx:", tx);
    }

    const account = await program.account.piggyBank.fetch(piggyBankPda);
    assert.ok(account.owner.equals(user.publicKey), "owner should match wallet");
    console.log("  PDA owner:", account.owner.toBase58());
  });

  // ── Test 2: Deposit ──────────────────────────────────────────────────────
  it("Deposits 0.1 SOL and PDA balance increases", async () => {
    const depositAmount = 0.1 * LAMPORTS_PER_SOL;
    const balanceBefore = await provider.connection.getBalance(piggyBankPda);

    const tx = await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        piggyBank:     piggyBankPda,
        user:          user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  Deposit tx:", tx);
    const balanceAfter = await provider.connection.getBalance(piggyBankPda);
    assert.equal(balanceAfter - balanceBefore, depositAmount, "PDA balance should increase");
    console.log("  PDA balance:", balanceAfter / LAMPORTS_PER_SOL, "SOL");
  });

  // ── Test 3: Withdraw ─────────────────────────────────────────────────────
  it("Withdraws 0.05 SOL and user balance increases", async () => {
    const withdrawAmount = 0.05 * LAMPORTS_PER_SOL;
    const userBefore = await provider.connection.getBalance(user.publicKey);

    const tx = await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accounts({
        piggyBank:     piggyBankPda,
        owner:         user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  Withdraw tx:", tx);
    const userAfter = await provider.connection.getBalance(user.publicKey);
    assert.isAbove(userAfter, userBefore, "user balance should increase");
    console.log("  User balance:", userAfter / LAMPORTS_PER_SOL, "SOL");
  });

  // ── Test 4: Unauthorized Withdraw ────────────────────────────────────────
  it("Unauthorized withdrawal fails with Anchor constraint error", async () => {
    // Rogue wallet — does NOT own the piggy bank PDA.
    // Passing rogue as `owner` with user's PDA triggers ConstraintSeeds (2006)
    // before has_one (2003) because Anchor validates seeds first.
    // Both codes confirm the on-chain access control is working correctly.
    const rogue = Keypair.generate();
    console.log("  Rogue wallet:", rogue.publicKey.toBase58());

    try {
      await program.methods
        .withdraw(new anchor.BN(0.01 * LAMPORTS_PER_SOL))
        .accounts({
          piggyBank:     piggyBankPda,
          owner:         rogue.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([rogue])
        .rpc();

      assert.fail("Expected unauthorized withdraw to fail");
    } catch (err) {
      const code = err?.error?.errorCode?.number ?? err?.code;
      console.log("  Error code (expected 2003 or 2006):", code, "-", err?.error?.errorCode?.code);
      // 2003 = ConstraintHasOne, 2006 = ConstraintSeeds — both are Anchor access-control checks
      assert.ok(
        code === 2003 || code === 2006,
        `Expected Anchor constraint error 2003 or 2006, got ${code}`
      );
    }
  });
});
