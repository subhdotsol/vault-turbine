use crate::{events::DepositEvent, state::Vault};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut , has_one = owner)]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}

impl<'info> Deposit<'info> {
    pub fn intialize_instruction(&mut self, amount: u64) -> Result<()> {
        self.vault.balance += amount;
        emit!(DepositEvent { amount });
        Ok(())
    }
}
