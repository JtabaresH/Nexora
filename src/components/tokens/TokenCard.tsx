"use client";

import React from "react";
import { Token } from "@/types/token";
import { PricingService } from "@/services/pricing/pricing-service";
import Image from "next/image";
import { Coins } from "lucide-react";

interface TokenCardProps {
  token: Token;
  onSelect?: (token: Token) => void;
  showSendPrompt?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onSelect,
  showSendPrompt = false,
}) => {
  const formattedBalance = PricingService.formatTokenAmount(token.balance, token.decimals);
  const usdValue = PricingService.calculateUsdValue(token.balance, token.decimals, token.usdPrice);

  return (
    <div
      onClick={() => onSelect && onSelect(token)}
      className={`p-3.5 rounded-2xl bg-[#12141A] border border-[#1E2230] flex items-center justify-between transition-all ${
        onSelect ? "hover:border-[#2D3448] hover:bg-[#161822] cursor-pointer" : ""
      }`}
    >
      {/* Left: Token Logo & Names */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#181B26] border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
          {token.logoUrl ? (
            <Image
              src={token.logoUrl}
              alt={token.symbol}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <Coins className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div>
          <div className="font-semibold text-sm text-white flex items-center gap-1.5">
            <span>{token.name}</span>
            <span className="text-xs font-normal text-slate-400">({token.symbol})</span>
            {token.isCustom && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                CUSTOM
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {formattedBalance} {token.symbol}
          </div>
        </div>
      </div>

      {/* Right: Live Market Valuation and Change */}
      <div className="text-right">
        {usdValue !== null ? (
          <>
            <div className="font-semibold text-sm text-white">{usdValue}</div>
            <div className="flex items-center justify-end gap-1.5 text-[11px] mt-0.5">
              {token.usdPrice !== undefined && (
                <span className="text-slate-400 font-mono">
                  {PricingService.formatPrice(token.usdPrice)}
                </span>
              )}
              {token.priceChange24h !== undefined && (
                <span
                  className={`font-semibold text-[10px] ${
                    token.priceChange24h >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {token.priceChange24h >= 0 ? "+" : ""}
                  {token.priceChange24h.toFixed(1)}%
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-xs font-medium text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-md">
            Price unavailable
          </div>
        )}
      </div>
    </div>
  );
};
