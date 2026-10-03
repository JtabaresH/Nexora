"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { useNetwork } from "@/context/NetworkContext";
import { AssetService } from "@/services/assets/asset-service";
import { Transaction, TransactionFilter } from "@/types/transaction";
import { useState, useMemo } from "react";

export function useTransactions() {
  const { account, recentTransactions } = useWallet();
  const { demoMode } = useDemoMode();
  const { chainId } = useNetwork();
  const [filter, setFilter] = useState<TransactionFilter>("ALL");

  const address = account?.address || "0x0000000000000000000000000000000000000000";

  const {
    data: fetchedTxs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Transaction[]>({
    queryKey: ["transactions", address, chainId, demoMode],
    queryFn: async () => {
      const provider = AssetService.getProvider(demoMode);
      return await provider.getTransactions(address, chainId);
    },
    enabled: !!account?.address || demoMode,
    refetchInterval: demoMode ? false : 30_000, // Auto-refresh every 30s in live mode
    staleTime: 15_000,
  });

  // Merge fetched transactions with recent session transactions
  const allTransactions = useMemo(() => {
    const txMap = new Map<string, Transaction>();

    // Add recent session transactions first
    for (const tx of recentTransactions) {
      txMap.set(tx.hash.toLowerCase(), tx);
    }

    // Add fetched transactions if not already updated by local session
    for (const tx of fetchedTxs) {
      if (!txMap.has(tx.hash.toLowerCase())) {
        txMap.set(tx.hash.toLowerCase(), tx);
      }
    }

    // Sort descending by timestamp
    return Array.from(txMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [recentTransactions, fetchedTxs]);

  // Apply filter
  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") return allTransactions;

    return allTransactions.filter((tx) => {
      switch (filter) {
        case "TOKENS":
          return tx.type === "TOKEN_SEND" || tx.type === "TOKEN_RECEIVE";
        case "NFTS":
          return tx.type === "NFT_SEND" || tx.type === "NFT_RECEIVE";
        case "SENT":
          return tx.type === "TOKEN_SEND" || tx.type === "NFT_SEND";
        case "RECEIVED":
          return tx.type === "TOKEN_RECEIVE" || tx.type === "NFT_RECEIVE";
        default:
          return true;
      }
    });
  }, [allTransactions, filter]);

  return {
    transactions: filteredTransactions,
    allCount: allTransactions.length,
    filter,
    setFilter,
    isLoading,
    isError,
    error,
    refetch,
  };
}
