"use client";

import React, { useState } from "react";
import { NFT } from "@/types/nft";
import { Modal } from "../common/Modal";
import { MetadataService } from "@/services/metadata/metadata-service";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { getNetworkConfig } from "@/config/networks";
import Image from "next/image";
import { Send, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { useNFTTransferability } from "@/hooks/useNFTTransferability";

interface NFTDetailModalProps {
  nft: NFT | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (nft: NFT) => void;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({
  nft,
  isOpen,
  onClose,
  onSend,
}) => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedOwner, setCopiedOwner] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { transferability } = useNFTTransferability(nft ?? undefined);

  if (!nft) return null;

  const nonTransferable = transferability.status === "non_transferable";
  const chain = getNetworkConfig(nft.chainId);
  const fallback = MetadataService.getFallbackImage(nft.tokenId, nft.name);
  const displayImage = imgError || !nft.imageUrl ? fallback : nft.imageUrl;

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(nft.contractAddress);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleCopyOwner = async () => {
    if (!nft.owner) return;
    try {
      await navigator.clipboard.writeText(nft.owner);
      setCopiedOwner(true);
      setTimeout(() => setCopiedOwner(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={nft.name || `Token #${nft.tokenId}`}>
      <div className="space-y-5">
        {/* NFT Image View */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#181B26] border border-[#22283A] shadow-md">
          <Image
            src={displayImage}
            alt={nft.name || "NFT Image"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-white/10">
            {nft.standard}
          </div>
          {nft.standard === "ERC1155" && nft.quantity && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#00F293] text-xs font-black text-[#050608]">
              Quantity: {nft.quantity.toString()}
            </div>
          )}
        </div>

        {/* Title, Collection, & Description */}
        <div>
          <div className="text-xs font-semibold text-[#00F293] uppercase tracking-wider mb-1">
            {nft.collectionName || "World Collectibles"}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {nft.name || `Token #${nft.tokenId}`}
          </h3>
          {nft.description && (
            <p className="text-xs text-slate-300 leading-relaxed bg-[#141722] p-3 rounded-xl border border-[#1E2333]">
              {nft.description}
            </p>
          )}
        </div>

        {/* Attributes (if any) */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Attributes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {nft.attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#141722] border border-[#1E2333] flex flex-col"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {attr.trait_type}
                  </span>
                  <span className="text-xs font-semibold text-white mt-0.5 truncate">
                    {attr.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* On-Chain Specs */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Details
          </h4>
          <div className="space-y-2 bg-[#141722] p-3.5 rounded-xl border border-[#1E2333] text-xs">
            {/* Network */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network</span>
              <span className="font-medium text-white">{chain.name}</span>
            </div>

            {/* Standard */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Token Standard</span>
              <span className="font-mono text-white">{nft.standard}</span>
            </div>

            {/* Token ID */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Token ID</span>
              <span className="font-mono text-white">#{nft.tokenId}</span>
            </div>

            {/* Contract Address */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Contract</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-300">
                <span>{BlockchainClient.truncateAddress(nft.contractAddress)}</span>
                <button
                  onClick={handleCopyContract}
                  type="button"
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedContract ? (
                    <Check className="w-3.5 h-3.5 text-[#00F293]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Owner */}
            {nft.owner && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Owner</span>
                <div className="flex items-center gap-1.5 font-mono text-slate-300">
                  <span>{BlockchainClient.truncateAddress(nft.owner)}</span>
                  <button
                    onClick={handleCopyOwner}
                    type="button"
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedOwner ? (
                      <Check className="w-3.5 h-3.5 text-[#00F293]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {nonTransferable && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-200 text-xs">
            {transferability.reason}
          </div>
        )}

        {/* Send Action Button */}
        <button
          onClick={() => {
            onClose();
            onSend(nft);
          }}
          type="button"
          disabled={nonTransferable}
          className={`w-full py-3.5 rounded-2xl world-glow-btn flex items-center justify-center gap-2 text-sm font-bold ${
            nonTransferable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <Send className="w-4 h-4 stroke-[2.2]" />
          <span>Send NFT</span>
        </button>
      </div>
    </Modal>
  );
};
