"use client";

import { useQuery } from "@tanstack/react-query";
import { useDemoMode } from "@/context/DemoModeContext";
import { useNetwork } from "@/context/NetworkContext";
import { useWallet } from "@/context/WalletContext";
import {
  NFTTransferability,
  NFTTransferabilityService,
} from "@/services/nfts/nft-transferability";
import { NFT } from "@/types/nft";

const UNKNOWN_TRANSFERABILITY: NFTTransferability = { status: "unknown" };
const TRANSFERABLE: NFTTransferability = { status: "transferable" };

export function useNFTTransferability(nft?: NFT): {
  transferability: NFTTransferability;
  isChecking: boolean;
} {
  const { account } = useWallet();
  const { demoMode } = useDemoMode();
  const { chainId } = useNetwork();

  const { data, isFetching } = useQuery<NFTTransferability>({
    queryKey: [
      "nft-transferability",
      chainId,
      nft?.contractAddress,
      nft?.tokenId,
      account?.address,
    ],
    queryFn: () =>
      NFTTransferabilityService.checkTransferable(
        nft!,
        account!.address,
        chainId
      ),
    enabled: !!nft && !!account?.address && !demoMode,
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  if (demoMode) {
    return { transferability: TRANSFERABLE, isChecking: false };
  }

  return {
    transferability: data ?? UNKNOWN_TRANSFERABILITY,
    isChecking: isFetching,
  };
}
