import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VaultTurbin } from "../target/types/vault_turbin";
import { LiteSVM } from "litesvm";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import * as path from "path";

describe("vault-turbin", () => {
    // Configure the client to use the local cluster
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.vaultTurbin as Program<VaultTurbin>;
    const programId = program.programId;

    let svm: LiteSVM;
    let payer: Keypair;
    let vaultKeypair: Keypair;

    // Test amounts
    const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL
    const withdrawAmount = new anchor.BN(500_000_000); // 0.5 SOL

    before(async () => {
        svm = new LiteSVM();

        const programParams = {
            path: path.resolve(__dirname, "../target/deploy/vault_turbin.so"),
            programId: programId
        };
        svm.addProgramFromFile(programParams.programId, programParams.path);

        payer = Keypair.generate();
        svm.airdrop(payer.publicKey, 10_000_000_000n); // 10 SOL

        vaultKeypair = Keypair.generate();
    });

    it("Initializes the vault", async () => {
        const tx = await program.methods
            .intializeInstruction()
            .accounts({
                vault: vaultKeypair.publicKey,
                owner: payer.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        tx.recentBlockhash = svm.latestBlockhash().toString();
        tx.feePayer = payer.publicKey;
        tx.sign(payer, vaultKeypair);

        const txRes = svm.sendTransaction(tx);

        if ("err" in txRes) {
            throw new Error(txRes.err.toString());
        }

        const vaultAccount = svm.getAccount(vaultKeypair.publicKey);
        assert.ok(vaultAccount, "Vault account should exist");

        // Decode and log data
        const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccount.data));
        console.log("On chain Vault Data:", decodedVault);
        console.log("Vault Owner:", decodedVault.owner.toBase58());
        console.log("Initial Balance:", decodedVault.balance.toString());

        assert.ok(decodedVault.owner.equals(payer.publicKey), "Vault owner should be the payer");
        assert.ok(decodedVault.balance.eq(new anchor.BN(0)), "Initial balance should be 0");
    });

    it("Deposits SOL into the vault", async () => {
        const tx = await program.methods
            .depositInstruction(depositAmount)
            .accounts({
                vault: vaultKeypair.publicKey,
                owner: payer.publicKey,
            })
            .transaction();

        tx.recentBlockhash = svm.latestBlockhash().toString();
        tx.feePayer = payer.publicKey;
        tx.sign(payer);

        const txRes = svm.sendTransaction(tx);

        if ("err" in txRes) {
            throw new Error(txRes.err.toString());
        }

        const vaultAccount = svm.getAccount(vaultKeypair.publicKey);
        assert.ok(vaultAccount, "Vault account should exist");

        const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccount.data));
        console.log("Balance after deposit:", decodedVault.balance.toString());

        assert.ok(decodedVault.balance.eq(depositAmount), "Balance should equal deposit amount");
    });

    it("Withdraws SOL from the vault", async () => {
        const tx = await program.methods
            .withdrawInstruction(withdrawAmount)
            .accounts({
                vault: vaultKeypair.publicKey,
                owner: payer.publicKey,
            })
            .transaction();

        tx.recentBlockhash = svm.latestBlockhash().toString();
        tx.feePayer = payer.publicKey;
        tx.sign(payer);

        const txRes = svm.sendTransaction(tx);

        if ("err" in txRes) {
            throw new Error(txRes.err.toString());
        }

        const vaultAccount = svm.getAccount(vaultKeypair.publicKey);
        assert.ok(vaultAccount, "Vault account should exist");

        const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccount.data));
        console.log("Balance after withdrawal:", decodedVault.balance.toString());

        const expectedBalance = depositAmount.sub(withdrawAmount);
        assert.ok(decodedVault.balance.eq(expectedBalance), "Balance should be reduced by withdraw amount");
    });

    it("Fails to withdraw more than balance", async () => {
        const excessiveAmount = new anchor.BN(10_000_000_000); // 10 SOL

        const tx = await program.methods
            .withdrawInstruction(excessiveAmount)
            .accounts({
                vault: vaultKeypair.publicKey,
                owner: payer.publicKey,
            })
            .transaction();

        tx.recentBlockhash = svm.latestBlockhash().toString();
        tx.feePayer = payer.publicKey;
        tx.sign(payer);

        const txRes = svm.sendTransaction(tx);

        if ("err" in txRes) {
            console.log("Expected error caught: InsufficientBalance");
            assert.ok(true, "Should fail with InsufficientBalance error");
        } else {
            assert.fail("Should have thrown an error for insufficient balance");
        }
    });

    it("Fails when non owner tries to deposit", async () => {
        const fakeOwner = Keypair.generate();
        svm.airdrop(fakeOwner.publicKey, 1_000_000_000n); // 1 SOL for fees

        const tx = await program.methods
            .depositInstruction(depositAmount)
            .accounts({
                vault: vaultKeypair.publicKey,
                owner: fakeOwner.publicKey,
            })
            .transaction();

        tx.recentBlockhash = svm.latestBlockhash().toString();
        tx.feePayer = fakeOwner.publicKey;
        tx.sign(fakeOwner);

        const txRes = svm.sendTransaction(tx);

        if ("err" in txRes) {
            console.log("Expected error caught: ConstraintHasOne");
            assert.ok(true, "Should fail with has_one constraint violation");
        } else {
            assert.fail("Should have thrown an error for non owner");
        }
    });

    it("Closes the vault", async () => {
        // Get balance before closing
        const vaultAccountBefore = svm.getAccount(vaultKeypair.publicKey);
        const decodedBefore = program.coder.accounts.decode("vault", Buffer.from(vaultAccountBefore.data));
        console.log("Balance before close:", decodedBefore.balance.toString());

        const tx = await program.methods
            .closeInstruction()
            .accounts({
                vault: vaultKeypair.publicKey,
                owner: payer.publicKey,
            })
            .transaction();

        tx.recentBlockhash = svm.latestBlockhash().toString();
        tx.feePayer = payer.publicKey;
        tx.sign(payer);

        const txRes = svm.sendTransaction(tx);

        if ("err" in txRes) {
            throw new Error(txRes.err.toString());
        }

        // Verify the vault account is closed
        const vaultAccountAfter = svm.getAccount(vaultKeypair.publicKey);
        assert.ok(!vaultAccountAfter || vaultAccountAfter.lamports === 0n, "Vault account should be closed");
        console.log("Vault successfully closed");
    });
});
