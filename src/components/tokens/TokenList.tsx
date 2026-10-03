"use client";

import React, { useState } from "react";
import { Token } from "@/types/token";
import { TokenCard } from "./TokenCard";
import { ImportTokenModal } from "./ImportTokenModal";
import { TokenSkeleton } from "../common/LoadingState";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { Coins, Plus, Filter } from "lucide-react";

interface TokenListProps {
  tokens: Token[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  onSelectToken?: (token: Token) => void;
}

export const TokenList: React.FC<TokenListProps> = ({
  tokens,
  isLoading,
  isError,
  onRetry,
  onSelectToken,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);

  const tokensWithBalance = tokens.filter((t) => t.balance > BigInt(0));
  const displayedTokens = onlyWithBalance ? tokensWithBalance : tokens;

  return (
    <>
      <div className="mx-4 mt-6">
        {/* Header & Quick Actions */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Tokens
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              ({tokens.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter: Only with balance toggle */}
            {tokensWithBalance.length > 0 && (
              <button
                onClick={() => setOnlyWithBalance(!onlyWithBalance)}
                type="button"
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                  onlyWithBalance
                    ? "bg-[#00F293]/15 text-[#00F293] border-[#00F293]/30"
                    : "bg-[#141722] text-slate-400 border-[#222736] hover:text-white"
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>With Balance ({tokensWithBalance.length})</span>
              </button>
            )}

            {/* Import Custom Token Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              type="button"
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#1A1E2B] hover:bg-[#23293A] text-slate-200 hover:text-white border border-[#2B3247] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#00F293]" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Token List Content */}
        {isLoading ? (
          <div className="space-y-2.5">
            <TokenSkeleton />
            <TokenSkeleton />
            <TokenSkeleton />
          </div>
        ) : isError ? (
          <ErrorState
            title="Could not load tokens"
            message="Failed to fetch balance data from World Chain."
            onRetry={onRetry}
          />
        ) : displayedTokens.length === 0 ? (
          <EmptyState
            icon={Coins}
            title={onlyWithBalance ? "No tokens with balance" : "No tokens found"}
            description={
              onlyWithBalance
                ? "You currently have 0 balance in tracked assets. Tap 'With Balance' to see all network tokens."
                : "Your wallet does not currently hold any fungible tokens on this network."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {displayedTokens.map((token) => (
              <TokenCard
                key={`${token.chainId}-${token.address}-${token.symbol}`}
                token={token}
                onSelect={onSelectToken}
              />
            ))}
          </div>
        )}
      </div>

      {/* Import Custom Token Modal */}
      <ImportTokenModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onTokenImported={() => {
          onRetry?.();
        }}
      />
    </>
  );
};
