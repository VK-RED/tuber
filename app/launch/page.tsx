'use client';

import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, createMintToInstruction } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from "react";

export default function TokenLaunchPage(){

    const [token,setToken] = useState("");
    const [decimals,setDecimals] = useState(9);
    const [limit, setLimit] = useState(100);

    const {connection} = useConnection();
    const {publicKey, sendTransaction} = useWallet();

    const launchToken = async () => {

        if(!publicKey || !connection){
            window.alert("Connect the wallet to continue !");
            return null;
        }

        console.log({token,decimals,limit});

        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const keypair = Keypair.generate();

        const programId = TOKEN_2022_PROGRAM_ID;
        const associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID;

        // Create an account & Initialize it as a mint !
        const transaction = new Transaction().add(

            SystemProgram.createAccount({
                fromPubkey:publicKey,
                newAccountPubkey: keypair.publicKey,
                space: MINT_SIZE,
                lamports,
                programId,
            }),
            createInitializeMint2Instruction(keypair.publicKey, decimals, publicKey, publicKey, programId)

        );

        // create an ata

        const associatedToken = getAssociatedTokenAddressSync(keypair.publicKey, publicKey, false, programId);

        transaction.add(
            createAssociatedTokenAccountInstruction(
                publicKey,
                associatedToken,
                publicKey,
                keypair.publicKey,
                programId,
                associatedTokenProgramId
            )
        );

        // finally mint tokens to the ata

        transaction.add(
            createMintToInstruction(keypair.publicKey, associatedToken, publicKey, (limit * (10 ** decimals)), [], programId)
        )
        

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = publicKey;

        transaction.sign(keypair);

        const tx = await sendTransaction(transaction,connection);
        console.log(tx);

    }


    return (
        (
            <div className="flex flex-col items-center justify-center">

                <h1>Launch your token</h1>

                <input type="text" value={token} onChange={(e)=>setToken(e.target.value)} />
                <input value={decimals} onChange={(e)=>setDecimals(Number(e.target.value))} />
                <input value={limit} onChange={(e)=>setLimit(Number(e.target.value))} />
                <button onClick={launchToken}> LAUNCH IT </button>

            </div>
        )
    )
}