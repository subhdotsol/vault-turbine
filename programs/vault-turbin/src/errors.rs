use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
}
