use crate::{events::DepositEvent, state::Vault};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut , has_one = owner)]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}

impl<'info> Close<'info> {
    pub fn close_instruction(&mut self) -> Result<()> {
        self.vault.close();
        Ok(())
    }
}
