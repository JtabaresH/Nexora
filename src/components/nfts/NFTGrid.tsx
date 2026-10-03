"use client";

import React from "react";
import { NFT } from "@/types/nft";
import { useNFTs } from "@/hooks/useNFTs";
import { CollectionGroup } from "./CollectionGroup";
import { NFTSkeleton } from "../common/LoadingState";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { Image as ImageIcon } from "lucide-react";

interface NFTGridProps {
  onViewDetails: (nft: NFT) => void;
  onSend: (nft: NFT) => void;
}

export const NFTGrid: React.FC<NFTGridProps> = ({
  onViewDetails,
  onSend,
}) => {
  const {
    collections,
    filteredCollections,
    selectedCollection,
    setSelectedCollection,
    totalNFTCount,
    isLoading,
    isError,
    refetch,
  } = useNFTs();

  return (
    <div className="mx-4 mt-4">
      {/* Header and Total Count */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-white tracking-tight">NFT Gallery</h2>
        <span className="text-xs text-slate-400 font-medium bg-[#161822] px-2.5 py-1 rounded-full border border-white/5">
          {totalNFTCount} {totalNFTCount === 1 ? "Collectable" : "Collectibles"}
        </span>
      </div>

      {/* Collection Filter Pills (Horizontal Scroll) */}
      {collections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
          <button
            onClick={() => setSelectedCollection("ALL")}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCollection === "ALL"
                ? "bg-[#00F293] text-[#06070A] shadow-sm"
                : "bg-[#141722] text-slate-400 hover:text-white border border-[#202536]"
            }`}
          >
            All Collections ({collections.length})
          </button>
          {collections.map((col) => {
            const isSelected = selectedCollection === col.name;
            return (
              <button
                key={col.id}
                onClick={() => setSelectedCollection(col.name)}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#00F293] text-[#06070A] shadow-sm"
                    : "bg-[#141722] text-slate-400 hover:text-white border border-[#202536]"
                }`}
              >
                {col.name} ({col.items.length})
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <NFTSkeleton />
          <NFTSkeleton />
          <NFTSkeleton />
          <NFTSkeleton />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load NFTs"
          message="Failed to fetch digital collectibles from World Chain."
          onRetry={refetch}
        />
      ) : filteredCollections.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No NFTs yet"
          description="Your NFTs and digital collectibles will appear here."
        />
      ) : (
        <div className="mt-2">
          {filteredCollections.map((col) => (
            <CollectionGroup
              key={col.id}
              collection={col}
              onViewDetails={onViewDetails}
              onSend={onSend}
            />
          ))}
        </div>
      )}
    </div>
  );
};
