import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

const idl = require("../target/idl/piggybank.json");
const PROGRAM_ID = new PublicKey("FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12");

describe("piggybank", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, provider);
  const user    = provider.wallet as anchor.Wallet;

  const [piggyBankPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("piggybank"), user.publicKey.toBuffer()],
    PROGRAM_ID
  );

  // ── Test 1: Initialize ───────────────────────────────────────────────────
  it("Initializes the piggy bank", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        piggyBank:     piggyBankPda,
        user:          user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  Init tx:", tx);

    const account = await (program.account as any).piggyBank.fetch(piggyBankPda);
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
    assert.equal(
      balanceAfter - balanceBefore,
      depositAmount,
      "PDA balance should increase by deposit amount"
    );
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
    assert.isAbove(userAfter, userBefore, "user balance should increase after withdrawal");
    console.log("  User balance:", userAfter / LAMPORTS_PER_SOL, "SOL");
  });

  // ── Test 4: Unauthorized Withdraw ────────────────────────────────────────
  it("Unauthorized withdrawal fails with ConstraintHasOne (2003)", async () => {
    const rogue = Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      rogue.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig, "confirmed");
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
    } catch (err: any) {
      console.log("  Error caught (expected):", JSON.stringify(err?.error?.errorCode ?? err?.code ?? err?.message?.slice(0,60)));
      const code = err?.error?.errorCode?.number ?? err?.code;
      assert.equal(code, 2003, "Expected ConstraintHasOne error code 2003");
    }
  });
});
