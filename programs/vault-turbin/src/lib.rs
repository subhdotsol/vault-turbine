use anchor_lang::prelude::*;

mod errors;
mod events;
mod instructions;
mod state;

use instructions::*;

declare_id!("FHCukF88jMQoTSTVb5n7RLTasx91kNZm2cDihpqTMx8o");

#[program]
pub mod vault_turbin {
    use super::*;

    pub fn intialize_instruction(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.intialize_instruction();
        Ok(())
    }

    pub fn deposit_instruction(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit_instruction(amount);
        Ok(())
    }

    pub fn withdraw_instruction(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw_instruction(amount);
        Ok(())
    }

    pub fn close_instruction(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close_instruction();
        Ok(())
    }
}
