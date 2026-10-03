"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useNetwork } from "@/context/NetworkContext";
import { Modal } from "../common/Modal";
import { QRCodeDisplay } from "../common/QRCodeDisplay";
import { Copy, Check, Share2, AlertCircle } from "lucide-react";
import { BlockchainClient } from "@/services/blockchain/viem-client";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose }) => {
  const { account } = useWallet();
  const { currentChain } = useNetwork();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const address = account?.address || "0x0000000000000000000000000000000000000000";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My World Chain Address",
          text: address,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Assets">
      <div className="flex flex-col items-center text-center">
        {/* Network reminder */}
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181B26] border border-[#242A3C] text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#00F293]" />
          <span>{currentChain.name}</span>
        </div>

        {/* QR Code */}
        <QRCodeDisplay value={address} size={190} className="mb-4" />

        {/* Address & Truncated Preview */}
        <div className="w-full mb-4">
          <span className="text-xs text-slate-400 block mb-1">Your wallet address</span>
          <div className="font-mono text-sm font-semibold text-white tracking-wide mb-1">
            {BlockchainClient.truncateAddress(address, 8, 6)}
          </div>
          <div className="w-full p-2.5 rounded-xl bg-[#141722] border border-[#1E2333] font-mono text-[11px] text-slate-400 select-all break-all text-center">
            {address}
          </div>
        </div>

        {/* Actions: Copy & Share */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-4">
          <button
            onClick={handleCopy}
            type="button"
            className="py-3 px-4 rounded-xl bg-[#1E2230] hover:bg-[#282E40] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#00F293]" />
                <span className="text-[#00F293]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy address</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            type="button"
            className="py-3 px-4 rounded-xl bg-[#1E2230] hover:bg-[#282E40] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>{shared ? "Shared!" : "Share"}</span>
          </button>
        </div>

        {/* Notice */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-left text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Only send compatible assets (ERC-20, ERC-721, ERC-1155) on <strong>{currentChain.name}</strong> to this address.
          </span>
        </div>
      </div>
    </Modal>
  );
};
