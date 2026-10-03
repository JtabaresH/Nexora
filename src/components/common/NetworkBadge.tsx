"use client";

import React from "react";
import { useNetwork } from "@/context/NetworkContext";
import { Globe, ChevronDown } from "lucide-react";

interface NetworkBadgeProps {
  onClick?: () => void;
  showSelectorArrow?: boolean;
}

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({
  onClick,
  showSelectorArrow = false,
}) => {
  const { currentChain } = useNetwork();

  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181B24] border border-[#262B3A] text-xs font-medium text-slate-300 hover:text-white hover:border-[#384055] transition-all cursor-pointer"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          currentChain.testnet
            ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            : "bg-[#00F293] shadow-[0_0_8px_rgba(0,242,147,0.5)]"
        }`}
      />
      <span>{currentChain.shortName}</span>
      {showSelectorArrow && <ChevronDown className="w-3 h-3 text-slate-400" />}
    </button>
  );
};
