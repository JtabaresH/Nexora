"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { useNetwork } from "@/context/NetworkContext";
import { AssetService } from "@/services/assets/asset-service";
import { NFT, NFTCollectionGroup } from "@/types/nft";
import { groupNFTsByCollection } from "@/services/assets/types";
import { useState, useMemo } from "react";

export function useNFTs() {
  const { account } = useWallet();
  const { demoMode } = useDemoMode();
  const { chainId } = useNetwork();
  const [selectedCollection, setSelectedCollection] = useState<string>("ALL");

  const address = account?.address || "0x0000000000000000000000000000000000000000";

  const {
    data: nfts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<NFT[]>({
    queryKey: ["nfts", address, chainId, demoMode],
    queryFn: async () => {
      const provider = AssetService.getProvider(demoMode);
      return await provider.getNFTs(address, chainId);
    },
    enabled: !!account?.address || demoMode,
    refetchInterval: demoMode ? false : 60_000, // Auto-refresh every 60s in live mode
    staleTime: 30_000,
  });

  // Group NFTs by collection
  const collections: NFTCollectionGroup[] = useMemo(() => {
    return groupNFTsByCollection(nfts);
  }, [nfts]);

  // Filtered collections or NFTs
  const filteredCollections = useMemo(() => {
    if (selectedCollection === "ALL") {
      return collections;
    }
    return collections.filter((col) => col.name === selectedCollection || col.id === selectedCollection);
  }, [collections, selectedCollection]);

  const totalNFTCount = useMemo(() => {
    return nfts.reduce((acc, nft) => acc + Number(nft.quantity || BigInt(1)), 0);
  }, [nfts]);

  return {
    nfts,
    collections,
    filteredCollections,
    selectedCollection,
    setSelectedCollection,
    totalNFTCount,
    isLoading,
    isError,
    error,
    refetch,
  };
}
