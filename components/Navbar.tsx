"use client";
import dynamic from 'next/dynamic';
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const WalletDisconnectButton = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);

export const Navbar = () => {

    const {wallet} = useWallet();

    return (
        <div className="flex items-center justify-between px-8 py-3 w-screen">

            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
                Tuber
            </h1>

            {
                wallet ? <WalletDisconnectButton /> : <WalletMultiButton/>
            }

        </div>
    )
}