import { PublicKey } from "@solana/web3.js";
import { ChangeEvent, ReactNode } from "react";

export interface UserMints{
    mint: string;
    balance: number;
    programId: PublicKey;
    decimals: number
}

export interface TokenCardProps{
    type:"base"|"quote";
    liquidity:number;
    onLiquidityChange:(e:ChangeEvent<HTMLInputElement>)=>void;
    mint?:UserMints
    userMints:UserMints[],
    onMintchange: (e:ChangeEvent<HTMLSelectElement>, mintChange:"base"|"quote")=>void;
}

export interface ButtonProps{
    children:ReactNode;
    onClick:()=>void;
}