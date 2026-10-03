"use client";

import React from "react";
import { Transaction } from "@/types/transaction";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";

interface TransactionItemProps {
  tx: Transaction;
  onClick: (tx: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onClick }) => {
  const isReceive = tx.type === "TOKEN_RECEIVE" || tx.type === "NFT_RECEIVE";
  const isNFT = tx.type === "NFT_SEND" || tx.type === "NFT_RECEIVE";

  // Formatted date
  const dateStr = new Date(tx.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={() => onClick(tx)}
      className="p-3.5 rounded-2xl bg-[#12141A] border border-[#1E2230] hover:border-[#2C3246] hover:bg-[#161822] flex items-center justify-between transition-all cursor-pointer group"
    >
      {/* Icon & Title */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isReceive
              ? "bg-[#00F293]/10 text-[#00F293] border border-[#00F293]/20"
              : "bg-slate-800/60 text-slate-300 border border-slate-700/40"
          }`}
        >
          {isNFT ? (
            <ImageIcon className="w-5 h-5" />
          ) : isReceive ? (
            <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
          )}
        </div>

        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-1.5">
            <span>
              {isNFT
                ? isReceive
                  ? "NFT Received"
                  : "NFT Sent"
                : isReceive
                ? "Received"
                : "Sent"}
            </span>
            {tx.status === "PENDING" && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Amount & Status Badge */}
      <div className="text-right">
        <div
          className={`font-semibold text-sm ${
            isReceive ? "text-[#00F293]" : "text-white"
          }`}
        >
          {isNFT ? (
            <span>{tx.assetName || `Token #${tx.tokenId}`}</span>
          ) : (
            <span>
              {isReceive ? "+" : "-"}
              {tx.amount} {tx.assetSymbol}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1 mt-0.5">
          {tx.status === "CONFIRMED" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Confirmed</span>
            </span>
          ) : tx.status === "PENDING" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Pending</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
              <XCircle className="w-3 h-3" />
              <span>Failed</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
