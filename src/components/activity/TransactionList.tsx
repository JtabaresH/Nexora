"use client";

import React, { useState } from "react";
import { Transaction, TransactionFilter } from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionItem } from "./TransactionItem";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { TransactionSkeleton } from "../common/LoadingState";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { Clock } from "lucide-react";

export const TransactionList: React.FC = () => {
  const {
    transactions,
    filter,
    setFilter,
    isLoading,
    isError,
    refetch,
  } = useTransactions();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filterOptions: { label: string; value: TransactionFilter }[] = [
    { label: "All", value: "ALL" },
    { label: "Tokens", value: "TOKENS" },
    { label: "NFTs", value: "NFTS" },
    { label: "Sent", value: "SENT" },
    { label: "Received", value: "RECEIVED" },
  ];

  return (
    <div className="mx-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-white tracking-tight">Activity</h2>
        <span className="text-xs text-slate-400 font-medium bg-[#161822] px-2.5 py-1 rounded-full border border-white/5">
          {transactions.length} Records
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-1">
        {filterOptions.map((opt) => {
          const isSelected = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#00F293] text-[#06070A] shadow-sm"
                  : "bg-[#141722] text-slate-400 hover:text-white border border-[#202536]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5 mt-2">
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load activity"
          message="Failed to fetch transaction history from network."
          onRetry={refetch}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No transactions yet"
          description="Your on-chain transfers and NFT receipts will appear in this history."
        />
      ) : (
        <div className="space-y-2.5 mt-2">
          {transactions.map((tx) => (
            <TransactionItem
              key={tx.hash}
              tx={tx}
              onClick={(clicked) => setSelectedTx(clicked)}
            />
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        tx={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
