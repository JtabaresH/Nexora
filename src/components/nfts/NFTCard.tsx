"use client";

import React, { useState } from "react";
import { NFT } from "@/types/nft";
import Image from "next/image";
import { Send, Eye, Sparkles } from "lucide-react";
import { MetadataService } from "@/services/metadata/metadata-service";

interface NFTCardProps {
  nft: NFT;
  onViewDetails: (nft: NFT) => void;
  onSend: (nft: NFT) => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  onViewDetails,
  onSend,
}) => {
  const [imageError, setImageError] = useState(false);

  const fallback = MetadataService.getFallbackImage(nft.tokenId, nft.name);
  const displayImage = imageError || !nft.imageUrl ? fallback : nft.imageUrl;

  return (
    <div className="rounded-2xl overflow-hidden bg-[#11131A] border border-[#1E2230] flex flex-col justify-between group hover:border-[#2F364C] transition-all">
      {/* Top Image & Badges */}
      <div
        className="relative aspect-square w-full overflow-hidden bg-[#181B26] cursor-pointer"
        onClick={() => onViewDetails(nft)}
      >
        <Image
          src={displayImage}
          alt={nft.name || `Token #${nft.tokenId}`}
          fill
          sizes="(max-width: 430px) 50vw, 200px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
          unoptimized
        />

        {/* Standard Badge (ERC-721 / ERC-1155) */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
          <span>{nft.standard}</span>
        </div>

        {/* Quantity Badge for ERC-1155 */}
        {nft.standard === "ERC1155" && nft.quantity && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#00F293]/90 text-[10px] font-extrabold text-[#050608] shadow-sm">
            x{nft.quantity.toString()}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-[11px] font-medium text-slate-400 truncate mb-0.5">
            {nft.collectionName || "World Collectibles"}
          </div>
          <h4
            onClick={() => onViewDetails(nft)}
            className="text-sm font-semibold text-white truncate cursor-pointer hover:text-[#00F293] transition-colors"
          >
            {nft.name || `Token #${nft.tokenId}`}
          </h4>
          <div className="text-xs font-mono text-slate-500 mt-0.5">
            Token #{nft.tokenId}
          </div>
        </div>

        {/* Action Buttons: [View details] & [Send] */}
        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-[#1C202C]">
          <button
            onClick={() => onViewDetails(nft)}
            type="button"
            className="py-1.5 px-2 rounded-xl bg-[#181B26] hover:bg-[#202534] text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => onSend(nft)}
            type="button"
            className="py-1.5 px-2 rounded-xl bg-[#00F293]/10 hover:bg-[#00F293]/20 text-[#00F293] text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
