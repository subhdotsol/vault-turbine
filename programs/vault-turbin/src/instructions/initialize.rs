use crate::state::Vault;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init , payer = owner , space = Vault::LEN)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn intialize_instruction(&mut self) -> Result<()> {
        self.vault.owner = self.owner.key();
        self.vault.balance = 0;
        Ok(())
    }
}
