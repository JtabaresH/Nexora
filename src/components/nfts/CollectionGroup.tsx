"use client";

import React from "react";
import { NFT, NFTCollectionGroup } from "@/types/nft";
import { NFTCard } from "./NFTCard";
import { Layers } from "lucide-react";
import { BlockchainClient } from "@/services/blockchain/viem-client";

interface CollectionGroupProps {
  collection: NFTCollectionGroup;
  onViewDetails: (nft: NFT) => void;
  onSend: (nft: NFT) => void;
}

export const CollectionGroup: React.FC<CollectionGroupProps> = ({
  collection,
  onViewDetails,
  onSend,
}) => {
  return (
    <div className="mb-6">
      {/* Collection Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#181B26] border border-white/10 flex items-center justify-center text-[#00F293]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            {collection.name}
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
            {collection.items.length} {collection.items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          {BlockchainClient.truncateAddress(collection.contractAddress, 4, 3)}
        </div>
      </div>

      {/* Grid of NFTs in this collection */}
      <div className="grid grid-cols-2 gap-3">
        {collection.items.map((nft) => (
          <NFTCard
            key={`${nft.chainId}-${nft.contractAddress}-${nft.tokenId}`}
            nft={nft}
            onViewDetails={onViewDetails}
            onSend={onSend}
          />
        ))}
      </div>
    </div>
  );
};
