use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

declare_id!("FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12");

#[program]
pub mod piggybank {
    use super::*;

    /// Creates the user's personal PDA piggy bank account.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let bank      = &mut ctx.accounts.piggy_bank;
        bank.owner    = ctx.accounts.user.key();
        bank.bump     = ctx.bumps.piggy_bank;
        Ok(())
    }

    /// Moves SOL from the user's wallet into their PDA.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        invoke(
            &system_instruction::transfer(
                ctx.accounts.user.key,
                &ctx.accounts.piggy_bank.key(),
                amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.piggy_bank.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        Ok(())
    }

    /// Moves SOL from the PDA back to the owner.
    /// Uses direct lamport manipulation — our program owns the PDA so it can
    /// mutate its lamports directly. System program transfer is rejected for
    /// accounts that carry data. has_one = owner enforces only owner can call.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        **ctx.accounts.piggy_bank.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }
}

// ─── Account Contexts ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer  = user,
        space  = PiggyBank::LEN,
        seeds  = [b"piggybank", user.key().as_ref()],
        bump
    )]
    pub piggy_bank:     Account<'info, PiggyBank>,
    #[account(mut)]
    pub user:           Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"piggybank", user.key().as_ref()],
        bump  = piggy_bank.bump
    )]
    pub piggy_bank:     Account<'info, PiggyBank>,
    #[account(mut)]
    pub user:           Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds   = [b"piggybank", owner.key().as_ref()],
        bump    = piggy_bank.bump,
        has_one = owner   // enforces piggy_bank.owner == owner.key()
    )]
    pub piggy_bank:     Account<'info, PiggyBank>,
    #[account(mut)]
    pub owner:          Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ─── Account State ────────────────────────────────────────────────────────────

#[account]
pub struct PiggyBank {
    pub owner: Pubkey,  // 32 bytes — wallet that owns this piggy bank
    pub bump:  u8,      //  1 byte  — stored so we can sign PDAs
}

impl PiggyBank {
    pub const LEN: usize = 8   // Anchor discriminator
        + 32               // owner: Pubkey
        + 1;               // bump:  u8
}
