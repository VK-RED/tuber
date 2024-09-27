"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ChangeEvent, useEffect, useState } from "react";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { GetProgramAccountsFilter, PublicKey, Transaction } from "@solana/web3.js";
import { CreateCpmmPoolParam, DEVNET_PROGRAM_ID, div, getCpmmPdaAmmConfigId, Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { txVersion } from "./config";

interface UserMints{
  mint: string;
  balance: number;
  programId: PublicKey;
  decimals: number
}

export default function Home() {

  const {publicKey,signTransaction,sendTransaction} = useWallet();
  const {connection} = useConnection();

  const [userMints,setUserMints] = useState<UserMints[]>([]);
  
  const [mintA,setMintA] = useState<UserMints>()
  const [mintB,setMintB] = useState<UserMints>()
  
  const [mintAliquid,setMintALiquid] = useState(0);
  const [mintBliquid,setMintBLiquid] = useState(0);

  useEffect(()=>{
    getAllTokenAccounts();
  },[publicKey])

  const addLiquidity = async() => {

    if(mintAliquid === 0 || mintBliquid === 0){
      window.alert("The liquidity can't be 0");
      return;
    }

    if(publicKey && mintA && mintB && signTransaction){

      const raydium = await Raydium.load({connection,cluster:"devnet",owner:publicKey});

      const mint1 = {
        address: mintA.mint,
        decimals: mintA.decimals,
        programId: mintA.programId.toBase58(),
      }
      
      const mint2 = {
        address: mintB.mint,
        decimals: mintB.decimals,
        programId: mintB.programId.toBase58(),
      }

      const feeConfigs = await raydium.api.getCpmmConfigs()

      if (raydium.cluster === 'devnet') {

        feeConfigs.forEach((config) => {
          config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58()
        })
      }

      const payload : CreateCpmmPoolParam<TxVersion.V0> = {
        // CHANGE THIS ON MAINNET
        programId:DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount:DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,

        mintA:mint1,
        mintB:mint2,
        mintAAmount:mintAliquid * (10 ** mintA.decimals),
        mintBAmount:mintBliquid * (10 ** mintB.decimals),
        feeConfig:feeConfigs[0],
        ownerInfo:{ 
          useSOLBalance:true,
        },
        txVersion:txVersion,
        startTime: 0,
        associatedOnly:false,
      }
      

      try {
        
        const {transaction} = await raydium.cpmm.createPool(payload);
        const txSig = await sendTransaction(transaction,connection);
        console.log(txSig);

      } catch (error) {
        console.log(error);
      }

      
    }
  }

  const getAllTokenAccounts = async () => {

    if(!publicKey){
      console.log("No Public Key found !");
      return;
    }


    // TOKEN 2022 PROGRAM
    const res1 = await connection.getParsedTokenAccountsByOwner(publicKey,{programId:TOKEN_2022_PROGRAM_ID});
    // LEGACY TOKEN PROGRAM
    const res2 = await connection.getParsedTokenAccountsByOwner(publicKey,{programId:TOKEN_PROGRAM_ID});

    const arr1 = res1.value.map((data)=>{

      const info = data.account.data.parsed["info"];
      const mint:string =  info.mint;
      const balance = Number(info.tokenAmount.uiAmountString);
      const programId = data.account.owner;
      const decimals:number = info.tokenAmount.decimals;

      return {mint,balance,programId, decimals};

    });

    const arr2 = res2.value.map((data)=>{

      const info = data.account.data.parsed["info"];
      const mint:string =  info.mint;
      const balance = Number(info.tokenAmount.uiAmountString);
      const programId = data.account.owner;
      const decimals:number = info.tokenAmount.decimals;

      return {mint,balance,programId, decimals};

    });

    const arr = [...arr1, ...arr2];
    console.log(arr);
    
    setUserMints([...arr1, ...arr2]);

    if(arr.length > 1){
      const mint1 = arr[0];
      const mint2 = arr1[1];

      setMintA(mint1);
      setMintB(mint2);
    }
    
  }

  const handleMintChange = (e:ChangeEvent<HTMLSelectElement>, mintChange:"mintA"|"mintB") => {
    const selectedOption = userMints.find((m)=>m.mint === e.target.value) || null;

    if(selectedOption){
      if(mintChange === "mintA"){
        setMintA(selectedOption);
      }
      else{
        setMintB(selectedOption);
      }
    }
  }


  return (
    <div className="flex flex-col items-center justify-center p-10">
      
      <div className="flex gap-x-[100px]">

        {/* MINT A */}

        <div className="flex flex-col items-center gap-y-3 border min-w-[300px]">

            <div>Select Base Token</div>


            <select className="w-full text-center" value={mintA?.mint} onChange={(e)=>handleMintChange(e,"mintA")}>

              {
                userMints.filter((m) => m.mint !== mintB?.mint).map(val => (

                  <option key={val.mint} value={val.mint}>
                    {val.mint}
                  </option>
                )) 
              }
              {userMints.length === 0 && <option className="w-full" value={"NO TOKEN"}>NO TOKEN</option>}
            </select>

            <div>{`TOKEN BALANCE : ${mintA?.balance || 0}`}</div>

            <input type="number" className="text-center" value={mintAliquid} onChange={(e)=>setMintALiquid(Number(e.target.value))} />

        </div>

        {/* MINT B */}

        <div className="flex flex-col items-center gap-y-3 border min-w-[300px]">

            <div>Select Quote Token</div>

            <select value={mintB?.mint} onChange={(e)=>handleMintChange(e,"mintB")} className="w-full text-center">
              {
                userMints.filter((m) => m.mint !== mintA?.mint).map(val => (

                  <option key={val.mint} value={val.mint}>
                    {val.mint}
                  </option>
                )) 
              }
              {userMints.length === 0 && <option className="w-full" value={"NO TOKEN"}>NO TOKEN</option>}
            </select>

            <div>{`TOKEN BALANCE : ${mintB?.balance || 0}`}</div>

            <input type="number" className="text-center" value={mintBliquid} onChange={(e)=>setMintBLiquid(Number(e.target.value))} />

        </div>  

      </div>

      <button onClick={addLiquidity} className="mx-auto px-2 py-1 text-white bg-black rounded-xl font-semibold my-8">
          Create Liquidity Pool
      </button>

    </div>
  );
}

/*
  {
            "account": {
                "data": {
                    "parsed": {
                        "info": {
                            "isNative": false,
                            "mint": "6vQNLKKh4mdTj4QNFWSjYNHDQJ1wALgs2hbY3CqJ9enF",
                            "owner": "GZuCVbPM1xDMjdtPxri3zmbusVpDtnUaDksyZ3mqsA9H",
                            "state": "initialized",
                            "tokenAmount": {
                                "amount": "100500",
                                "decimals": 2,
                                "uiAmount": 1005.0,
                                "uiAmountString": "1005"
                            }
                        },
                        "type": "account"
                    },
                    "program": "spl-token",
                    "space": 165
                },
                "executable": false,
                "lamports": 2039280,
                "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "rentEpoch": 18446744073709551615,
                "space": 165
            },
            "pubkey": "A9FVFjhBMxzyizjR9JSy8Vm15eBevrkecoi7gXRbiuHG"
        },
*/