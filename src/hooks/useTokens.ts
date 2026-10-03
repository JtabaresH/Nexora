"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { useNetwork } from "@/context/NetworkContext";
import { AssetService } from "@/services/assets/asset-service";
import { Token } from "@/types/token";

export function useTokens() {
  const { account } = useWallet();
  const { demoMode } = useDemoMode();
  const { chainId } = useNetwork();

  const address = account?.address || "0x0000000000000000000000000000000000000000";

  const {
    data: tokens = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Token[]>({
    queryKey: ["tokens", address, chainId, demoMode],
    queryFn: async () => {
      const provider = AssetService.getProvider(demoMode);
      return await provider.getTokens(address, chainId);
    },
    enabled: !!account?.address || demoMode,
    refetchInterval: 30_000, // 30 seconds live market price auto-refresh
    staleTime: 15_000,
  });

  // Calculate total portfolio USD value
  const totalPortfolioUsd = tokens.reduce((acc, token) => {
    if (token.usdPrice !== undefined && token.usdPrice !== null) {
      const humanAmount = Number(token.balance) / 10 ** token.decimals;
      return acc + humanAmount * token.usdPrice;
    }
    return acc;
  }, 0);

  const formattedPortfolioValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalPortfolioUsd);

  // Identify primary token (WLD) and other tokens
  const primaryToken = tokens.find((t) => t.symbol === "WLD") || tokens[0];
  const otherTokens = tokens.filter((t) => t !== primaryToken);

  return {
    tokens,
    primaryToken,
    otherTokens,
    totalPortfolioUsd,
    formattedPortfolioValue,
    isLoading,
    isError,
    error,
    refetch,
  };
}
