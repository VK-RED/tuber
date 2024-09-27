"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ChangeEvent, useEffect, useState } from "react";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { CreateCpmmPoolParam, DEVNET_PROGRAM_ID, getCpmmPdaAmmConfigId, Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { txVersion } from "./config";
import { TokenCard } from "@/components/TokenCard";
import { UserMints } from "@/lib/types";
import { PlusIcon } from "@/components/icons";
import { ShimmerButton } from "@/components/ShimmerButton";

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

  const handleMintChange = (e:ChangeEvent<HTMLSelectElement>, mintChange:"base"|"quote") => {
    const selectedOption = userMints.find((m)=>m.mint === e.target.value) || null;

    if(selectedOption){
      if(mintChange === "base"){
        setMintA(selectedOption);
      }
      else{
        setMintB(selectedOption);
      }
    }
  }

  return (
      <div className="flex flex-col items-center max-w-screen-2xl mx-auto py-5 ">

        <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
            Create Liquidity Pool
        </h2>

        <p className="leading-7 font-medium text-gray-600 mb-10">
          Powered by Raydium V3
        </p>
        
        <div className="relative mb-6">

          <TokenCard 
            type="base"
            userMints={userMints.filter((m) => m.mint !== mintB?.mint)} 
            mint={mintA}
            onLiquidityChange={(e)=>{
              setMintALiquid(Number(e.target.value))
            }}
            liquidity={mintAliquid}
            onMintchange={handleMintChange}
          />

          <TokenCard 
            type="quote"
            userMints={userMints.filter((m) => m.mint !== mintA?.mint)} 
            mint={mintB}
            onLiquidityChange={(e)=>{
              setMintBLiquid(Number(e.target.value))
            }}
            liquidity={mintBliquid}
            onMintchange={handleMintChange}
          />

          <PlusIcon className="absolute top-[170px] left-[180px] h-10 w-10"/>
        </div>

        <ShimmerButton onClick={addLiquidity}>
          Add Liquidity
        </ShimmerButton>

      </div>
  )
}