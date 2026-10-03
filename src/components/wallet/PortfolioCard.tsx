"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, Image as ImageIcon, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useDemoMode } from "@/context/DemoModeContext";

interface PortfolioCardProps {
  portfolioValue: string;
  onSend: () => void;
  onReceive: () => void;
  onGoNFTs: () => void;
  onGoActivity: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolioValue,
  onSend,
  onReceive,
  onGoNFTs,
  onGoActivity,
}) => {
  const { isConnected, connect, isConnecting } = useWallet();
  const { demoMode } = useDemoMode();

  return (
    <div className="mx-4 mt-3 p-5 rounded-3xl bg-gradient-to-b from-[#141722] to-[#0E1017] border border-[#222838] shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#00F293]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#00C2FF]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Portfolio Title & Balance */}
      <div className="relative z-10">
        {!demoMode && !isConnected ? (
          <div className="py-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#00F293]/15 text-[#00F293] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Connect Your Wallet</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-[260px] mx-auto">
              Sign in with World ID to view and manage your live tokens and collectibles on World Chain.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              type="button"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00F293] to-[#00C2FF] text-[#06070A] font-bold text-sm shadow-lg hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In with World ID (SIWE)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Portfolio
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 mb-6 tracking-tight">
              {portfolioValue}
            </div>

            {/* Quick Actions (Large Accessible Buttons) */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {/* Send */}
              <button
                onClick={onSend}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-[#181B26] hover:bg-[#202534] border border-[#262C3E] text-slate-200 hover:text-white transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00F293]/15 text-[#00F293] flex items-center justify-center group-hover:bg-[#00F293]/25 transition-colors">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium">Send</span>
              </button>

              {/* Receive */}
              <button
                onClick={onReceive}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-[#181B26] hover:bg-[#202534] border border-[#262C3E] text-slate-200 hover:text-white transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00C2FF]/15 text-[#00C2FF] flex items-center justify-center group-hover:bg-[#00C2FF]/25 transition-colors">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium">Receive</span>
              </button>

              {/* NFTs */}
              <button
                onClick={onGoNFTs}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-[#181B26] hover:bg-[#202534] border border-[#262C3E] text-slate-200 hover:text-white transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
                  <ImageIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium">NFTs</span>
              </button>

              {/* Activity */}
              <button
                onClick={onGoActivity}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-[#181B26] hover:bg-[#202534] border border-[#262C3E] text-slate-200 hover:text-white transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium">Activity</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
