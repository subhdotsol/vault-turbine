use crate::{events::WithdrawEvent, state::Vault};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut , has_one = owner)]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw_instruction(&mut self, amount: u64) -> Result<()> {
        require!(
            self.vault.balance >= amount,
            VaultError::InsufficientBalance
        );
        self.vault.balance -= amount;

        emit!(WithdrawEvent { amount });
        Ok(())
    }
}
