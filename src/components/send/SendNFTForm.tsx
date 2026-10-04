"use client";

import React, { useState } from "react";
import { NFT } from "@/types/nft";
import { nftTransferSchema } from "@/utils/validation";
import { AlertCircle, ChevronDown } from "lucide-react";
import { useNFTTransferability } from "@/hooks/useNFTTransferability";
import { NFTImage } from "@/components/nfts/NFTImage";

interface SendNFTFormProps {
  nfts: NFT[];
  preselectedNFT?: NFT;
  onProceedToConfirm: (data: {
    nft: NFT;
    recipient: string;
    quantity: bigint;
  }) => void;
}

export const SendNFTForm: React.FC<SendNFTFormProps> = ({
  nfts,
  preselectedNFT,
  onProceedToConfirm,
}) => {
  const [selectedNFT, setSelectedNFT] = useState<NFT>(
    preselectedNFT || nfts[0] || ({} as NFT)
  );
  const [showSelector, setShowSelector] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [error, setError] = useState<string | null>(null);

  const { transferability } = useNFTTransferability(
    selectedNFT.contractAddress ? selectedNFT : undefined
  );
  const nonTransferable = transferability.status === "non_transferable";
  const is1155 = selectedNFT.standard === "ERC1155";
  const maxQuantity = Number(selectedNFT.quantity || BigInt(1));

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRecipient(text.trim());
        setError(null);
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nonTransferable) return;

    const numQuantity = is1155 ? parseInt(quantity, 10) : 1;

    const validation = nftTransferSchema.safeParse({
      recipient,
      quantity: numQuantity,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid input");
      return;
    }

    if (is1155) {
      if (isNaN(numQuantity) || numQuantity <= 0) {
        setError("Quantity must be at least 1.");
        return;
      }
      if (numQuantity > maxQuantity) {
        setError(`You only have ${maxQuantity} of this NFT available.`);
        return;
      }
    }

    onProceedToConfirm({
      nft: selectedNFT,
      recipient: recipient.trim(),
      quantity: BigInt(numQuantity),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Selected NFT Preview / Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Collectible
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSelector(!showSelector)}
            className="w-full p-3 rounded-2xl bg-[#141722] border border-[#1E2333] hover:border-slate-600 flex items-center justify-between text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#1A1D27] overflow-hidden relative shrink-0">
                <NFTImage
                  nft={selectedNFT}
                  alt={selectedNFT.name || "NFT"}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">
                  {selectedNFT.name || `Token #${selectedNFT.tokenId}`}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedNFT.standard} • Token #{selectedNFT.tokenId}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* NFT List Dropdown */}
          {showSelector && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto no-scrollbar p-1 bg-[#161922] border border-[#222838] rounded-2xl shadow-2xl z-20 space-y-1">
              {nfts.map((item) => (
                <button
                  key={`${item.chainId}-${item.contractAddress}-${item.tokenId}`}
                  type="button"
                  onClick={() => {
                    setSelectedNFT(item);
                    setShowSelector(false);
                    setQuantity("1");
                  }}
                  className="w-full p-2 rounded-xl hover:bg-[#202534] flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-slate-800 shrink-0">
                    <NFTImage
                      nft={item}
                      alt={item.name || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-xs font-semibold text-white truncate">
                      {item.name || `Token #${item.tokenId}`}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.standard} {item.quantity ? `(Qty: ${item.quantity})` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Quantity (Only for ERC-1155) */}
      {is1155 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quantity to Send
            </label>
            <span className="text-[11px] text-slate-400">
              Available: {maxQuantity}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError(null);
              }}
              className="w-full p-3.5 rounded-2xl bg-[#141722] border border-[#1E2333] focus:border-[#00F293] outline-none text-sm font-semibold text-white transition-colors"
            />
          </div>
        </div>
      )}

      {/* 3. Recipient Address */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Recipient
          </label>
          <button
            type="button"
            onClick={handlePaste}
            className="text-[11px] font-semibold text-[#00F293] hover:underline cursor-pointer"
          >
            Paste Address
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="0x... or World ID address"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setError(null);
            }}
            className="w-full p-3.5 rounded-2xl bg-[#141722] border border-[#1E2333] focus:border-[#00F293] outline-none text-xs font-mono text-white placeholder-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/40 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {nonTransferable && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-200 text-xs">
          {transferability.reason}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={nonTransferable}
        className={`w-full py-3.5 rounded-2xl world-glow-btn text-sm font-bold mt-4 ${
          nonTransferable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        Review Transfer
      </button>
    </form>
  );
};
