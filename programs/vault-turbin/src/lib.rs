use anchor_lang::prelude::*;

mod errors;
mod events;
mod state;

declare_id!("FHCukF88jMQoTSTVb5n7RLTasx91kNZm2cDihpqTMx8o");

#[program]
pub mod vault_turbin {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
