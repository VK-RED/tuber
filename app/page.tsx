"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { GetProgramAccountsFilter, Transaction } from "@solana/web3.js";
import { DEVNET_PROGRAM_ID, getCpmmPdaAmmConfigId, Raydium } from "@raydium-io/raydium-sdk-v2";
import { txVersion } from "./config";



export default function Home() {

  const {publicKey,sendTransaction,signTransaction,signAllTransactions} = useWallet();
  const {connection} = useConnection();
  const [mintsAndBalance,setMintsAndBalance] = useState<{mint:string,balance:number}[]>();
  const [inputMint,setInputMint] = useState<{mint:string,balance:number}>()
  const [outputMint,setOutputMint] = useState<{mint:string,balance:number}>()
  
  const [inputAmount,setInputAmount] = useState(0);
  const [outputAmount,setOutputAmount] = useState(0);

  const addLiquidity = async() => {

    if(publicKey && inputMint && outputMint && signTransaction){
      const raydium = await Raydium.load({connection,cluster:"devnet",owner:publicKey});

      const mintA = await raydium.token.getTokenInfo(inputMint.mint)
      
      const mintB = await raydium.token.getTokenInfo(outputMint.mint)

      console.log(mintA);
      console.log(mintB);

      const feeConfigs = await raydium.api.getCpmmConfigs()

      if (raydium.cluster === 'devnet') {
        feeConfigs.forEach((config) => {
          config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58()
        })
      }
      try {
        const { builder,execute,transaction} = await raydium.cpmm.createPool({
          programId:DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
          poolFeeAccount:DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
          mintA,
          mintB,
          mintAAmount:inputAmount,
          mintBAmount:outputAmount,
          feeConfig:feeConfigs[0],
          ownerInfo:{ 
            useSOLBalance:true,
          },
          txVersion:txVersion,
          startTime: 0,
          associatedOnly:false,
        });
        
        await sendTransaction(transaction,connection);

        
      } catch (error) {
        console.log(error);
      }

      
    }
  }

  const getAllTokenAccounts = async () => {
    if(publicKey){

      const filters: GetProgramAccountsFilter[] = [
        {dataSize:165},
        {
          memcmp: {
            offset:32,
            bytes:publicKey.toBase58(),
          }
        }
      ]

      const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID,{filters});
      // console.log(accounts);
      const filteredMintAndBalance = accounts.map((account)=>{
        const parsedInfo = account.account.data;

        //@ts-ignore
        const mint:string = parsedInfo["parsed"]["info"]["mint"];
        //@ts-ignore
        const balance:number = parsedInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

        return {mint,balance};
      })

      setMintsAndBalance(filteredMintAndBalance);
      console.log(accounts);
      return accounts;

    }
  }

  

  useEffect(()=>{
    getAllTokenAccounts();
  },[publicKey])

  return (
    <div>
      Home Page
      
      <div className="flex flex-col my-8 max-w-sm">
        <div>
          Select MINT A
        </div>

        <div className="flex gap-x-4 items-center">
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" onChange={(e)=>{
                const selectedMint = mintsAndBalance?.filter((x) => x.mint === e.target.value)?.[0];
                if(selectedMint){
                  setInputMint(selectedMint)
                }

              }}>
              {
                mintsAndBalance?.map((item)=>(
                  <option key={item.mint} value={item.mint}>
                    {item.mint}
                  </option>
                ))
              }
            </select>

            <div>
              {inputMint && inputMint.balance}
            </div>

            <input className="border-2" value={inputAmount} onChange={(e)=>setInputAmount(Number(e.target.value))} />
        </div>

        
      </div>

      <div className="flex flex-col my-8 max-w-sm">
        <div>
          Select MINT B
        </div>

        <div className="flex gap-x-4 items-center">
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" onChange={(e)=>{
                const selectedMint = mintsAndBalance?.filter((x) => x.mint === e.target.value)?.[0];
                if(selectedMint){
                  setOutputMint(selectedMint)
                }

              }}>
              {
                mintsAndBalance?.map((item)=>(
                  <option key={item.mint} value={item.mint}>
                    {item.mint}
                  </option>
                ))
              }
            </select>

            <div>
              {outputMint && outputMint.balance}
            </div>

            <input className="border-2" value={outputAmount} onChange={(e)=>setOutputAmount(Number(e.target.value))} />
        </div>

        
      </div>

      <div>
        <button onClick={addLiquidity} 
          className="px-2 py-1 bg-black text-white rounded-xl font-semibold">
          Add Liquidity
        </button>
      </div>

      


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