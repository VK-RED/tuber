"use client";

import { TokenCardProps } from "@/lib/types";

export const TokenCard = ({type,userMints,mint,liquidity,onLiquidityChange,onMintchange}:TokenCardProps) => {

    return (
        <div className="flex flex-col border bg-gray-100 w-[400px] px-3 py-4 rounded-xl">
            
            <div className="font-medium text-zinc-500 text-xl mb-2 ml-1">{type === 'base' ? "Base" : "Quote"} token</div>

            <div className="flex items-end justify-between mb-4">

                <div className="max-w-[150px]">

                    <select onChange={(e)=>onMintchange(e,type)}

                        id="tokens" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 font-semibold text-lg rounded-lg outline-none block w-full p-2.5 h-16">
                        {userMints.length === 0 && <option>No Token</option>}

                        {
                            userMints.map(val => (
                                <option key={val.mint} value={val.mint}>
                                    {val.mint}
                                </option>
                            )) 
                        }

        
                    </select>

                </div>

                <input 
                    className="h-16 w-44 text-slate-600 bg-gray-100 text-6xl font-bold placeholder-slate-400 outline-none text-end [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    placeholder="0"
                    value={liquidity}
                    onChange={(e)=>onLiquidityChange(e)}
                />

            </div>

            
            <div className="font-medium text-zinc-500 mt-2 ml-1 text-xl">
                Balance : {mint?.balance || 0}
            </div>
            
            
        </div>
    )
}