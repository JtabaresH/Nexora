"use client";

import React, { useState } from "react";
import { Transaction } from "@/types/transaction";
import { Modal } from "../common/Modal";
import { getExplorerTxUrl, getNetworkConfig } from "@/config/networks";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { Copy, Check, ExternalLink, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TransactionDetailModalProps {
  tx: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  tx,
  isOpen,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState(false);
  const [copiedTo, setCopiedTo] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  if (!tx) return null;

  const chain = getNetworkConfig(tx.chainId);
  const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

  const handleCopy = async (text: string, setter: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details">
      <div className="space-y-4">
        {/* Status Header Pill */}
        <div className="flex flex-col items-center py-3 border-b border-[#1E2230]">
          {tx.status === "CONFIRMED" ? (
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : tx.status === "PENDING" ? (
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2 pending-pulse">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6" />
            </div>
          )}

          <div className="text-base font-bold text-white capitalize">
            {tx.status === "CONFIRMED"
              ? "Transaction Confirmed"
              : tx.status === "PENDING"
              ? "Transaction Pending"
              : "Transaction Failed"}
          </div>

          {tx.errorMessage && (
            <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/40 p-2.5 rounded-xl text-center">
              {tx.errorMessage}
            </div>
          )}
        </div>

        {/* Detailed Fields */}
        <div className="space-y-2.5 bg-[#141722] p-4 rounded-2xl border border-[#1E2333] text-xs">
          {/* Network */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Network</span>
            <span className="font-semibold text-white">{chain.name}</span>
          </div>

          {/* Asset & Amount */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Asset</span>
            <span className="font-semibold text-white">
              {tx.assetSymbol || tx.assetName || "World Chain Asset"}
            </span>
          </div>

          {tx.amount && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Amount</span>
              <span className="font-semibold text-white">
                {tx.amount} {tx.assetSymbol}
              </span>
            </div>
          )}

          {tx.tokenId && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Token ID</span>
              <span className="font-mono text-white">#{tx.tokenId}</span>
            </div>
          )}

          {tx.standard && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Standard</span>
              <span className="text-white font-semibold">{tx.standard}</span>
            </div>
          )}

          {tx.contractAddress && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Contract</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-300">
                <span>{BlockchainClient.truncateAddress(tx.contractAddress)}</span>
                <button
                  onClick={() => handleCopy(tx.contractAddress!, setCopiedContract)}
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
          )}

          {/* From */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">From</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-300">
              <span>{BlockchainClient.truncateAddress(tx.from)}</span>
              <button
                onClick={() => handleCopy(tx.from, setCopiedFrom)}
                type="button"
                className="p-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedFrom ? (
                  <Check className="w-3.5 h-3.5 text-[#00F293]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* To */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">To</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-300">
              <span>{BlockchainClient.truncateAddress(tx.to)}</span>
              <button
                onClick={() => handleCopy(tx.to, setCopiedTo)}
                type="button"
                className="p-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedTo ? (
                  <Check className="w-3.5 h-3.5 text-[#00F293]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Date</span>
            <span className="text-slate-300">
              {new Date(tx.timestamp).toLocaleString("en-US")}
            </span>
          </div>

          {/* Block Number */}
          {tx.blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Block</span>
              <span className="font-mono text-slate-300">#{tx.blockNumber}</span>
            </div>
          )}

          {/* Transaction Hash */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1E2333]">
            <span className="text-slate-400">Hash</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-300">
              <span>{BlockchainClient.truncateAddress(tx.hash, 8, 6)}</span>
              <button
                onClick={() => handleCopy(tx.hash, setCopiedHash)}
                type="button"
                className="p-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-[#00F293]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* View on Explorer Link */}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-2xl bg-[#161922] hover:bg-[#202534] border border-[#22283A] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>View on {chain.blockExplorers.default.name}</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </Modal>
  );
};
