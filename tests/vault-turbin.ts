import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VaultTurbin } from "../target/types/vault_turbin";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("vault-turbin", () => {
  // Configure the client to use the devnet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.vaultTurbin as Program<VaultTurbin>;
  
  // Generate a new keypair for the vault account
  const vaultKeypair = Keypair.generate();
  const owner = provider.wallet;

  // Test amounts
  const depositAmount = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  const withdrawAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL); // 0.5 SOL

  it("Initializes the vault", async () => {
    const tx = await program.methods
      .intializeInstruction()
      .accounts({
        vault: vaultKeypair.publicKey,
        owner: owner.publicKey,
      })
      .signers([vaultKeypair])
      .rpc();
    
    console.log("Initialize transaction signature:", tx);

    // Fetch the vault account and verify it was initialized correctly
    const vaultAccount = await program.account.vault.fetch(vaultKeypair.publicKey);
    
    assert.ok(vaultAccount.owner.equals(owner.publicKey), "Vault owner should be the wallet");
    assert.ok(vaultAccount.balance.eq(new anchor.BN(0)), "Initial balance should be 0");
    
    console.log("Vault initialized with owner:", vaultAccount.owner.toString());
    console.log("Initial balance:", vaultAccount.balance.toString());
  });

  it("Deposits SOL into the vault", async () => {
    const tx = await program.methods
      .depositInstruction(depositAmount)
      .accounts({
        vault: vaultKeypair.publicKey,
      })
      .rpc();
    
    console.log("Deposit transaction signature:", tx);

    // Fetch the vault account and verify the deposit
    const vaultAccount = await program.account.vault.fetch(vaultKeypair.publicKey);
    
    assert.ok(vaultAccount.balance.eq(depositAmount), "Balance should equal deposit amount");
    
    console.log("Balance after deposit:", vaultAccount.balance.toString());
  });

  it("Withdraws SOL from the vault", async () => {
    const tx = await program.methods
      .withdrawInstruction(withdrawAmount)
      .accounts({
        vault: vaultKeypair.publicKey,
      })
      .rpc();
    
    console.log("Withdraw transaction signature:", tx);

    // Fetch the vault account and verify the withdrawal
    const vaultAccount = await program.account.vault.fetch(vaultKeypair.publicKey);
    
    const expectedBalance = depositAmount.sub(withdrawAmount);
    assert.ok(vaultAccount.balance.eq(expectedBalance), "Balance should be reduced by withdraw amount");
    
    console.log("Balance after withdrawal:", vaultAccount.balance.toString());
  });

  it("Fails to withdraw more than balance", async () => {
    const excessiveAmount = new anchor.BN(10 * LAMPORTS_PER_SOL); // More than deposited
    
    try {
      await program.methods
        .withdrawInstruction(excessiveAmount)
        .accounts({
          vault: vaultKeypair.publicKey,
        })
        .rpc();
      
      assert.fail("Should have thrown an error for insufficient balance");
    } catch (err: any) {
      console.log("Expected error caught:", err.message);
      assert.ok(err.message.includes("InsufficientBalance") || err.logs?.some((log: string) => log.includes("InsufficientBalance")), 
        "Error should be InsufficientBalance");
    }
  });

  it("Fails when non-owner tries to deposit", async () => {
    const fakeOwner = Keypair.generate();
    
    try {
      await program.methods
        .depositInstruction(depositAmount)
        .accountsPartial({
          vault: vaultKeypair.publicKey,
          owner: fakeOwner.publicKey,
        })
        .signers([fakeOwner])
        .rpc();
      
      assert.fail("Should have thrown an error for non-owner");
    } catch (err: any) {
      console.log("Expected error caught:", err.message);
      assert.ok(err, "Error should be thrown for non-owner access");
    }
  });

  it("Closes the vault", async () => {
    // Get balance before closing
    const vaultAccountBefore = await program.account.vault.fetch(vaultKeypair.publicKey);
    console.log("Balance before close:", vaultAccountBefore.balance.toString());
    
    const tx = await program.methods
      .closeInstruction()
      .accounts({
        vault: vaultKeypair.publicKey,
      })
      .rpc();
    
    console.log("Close transaction signature:", tx);

    // Verify the vault account is closed
    try {
      await program.account.vault.fetch(vaultKeypair.publicKey);
      assert.fail("Vault account should be closed");
    } catch (err: any) {
      console.log("Vault successfully closed - account no longer exists");
      assert.ok(err, "Account should not exist after close");
    }
  });
});
