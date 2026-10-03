"use client";

import React, { useState } from "react";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { Copy, Check } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  prefixLen?: number;
  suffixLen?: number;
  showFullOnHover?: boolean;
  className?: string;
  onViewFull?: () => void;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  prefixLen = 6,
  suffixLen = 4,
  className = "",
  onViewFull,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const truncated = BlockchainClient.truncateAddress(address, prefixLen, suffixLen);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        onClick={onViewFull}
        className={`font-mono text-xs text-slate-300 ${
          onViewFull ? "cursor-pointer hover:text-white hover:underline underline-offset-2" : ""
        }`}
      >
        {truncated}
      </span>
      <button
        onClick={handleCopy}
        type="button"
        title={copied ? "Copied!" : "Copy address"}
        className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#00F293]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
