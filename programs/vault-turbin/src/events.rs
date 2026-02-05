use anchor_lang::prelude::*;

#[event]
pub struct DepositEvent {
    pub amount: u64,
}

#[event]
pub struct WithdrawEvent {
    pub amount: u64,
}
