"use client";

import React, { useState } from "react";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { getNetworkConfig, getExplorerTxUrl } from "@/config/networks";
import { useNetwork } from "@/context/NetworkContext";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export type ExecutionStatus = "IDLE" | "PENDING" | "SUCCESS" | "ERROR";

interface ConfirmTransactionProps {
  assetType: "TOKEN" | "NFT";
  assetTitle: string;
  assetSubtitle?: string;
  recipient: string;
  amountOrQuantity: string;
  onConfirm: () => Promise<{ success: boolean; hash?: string; error?: string }>;
  onClose: () => void;
  onSuccessDone: () => void;
}

export const ConfirmTransactionModal: React.FC<ConfirmTransactionProps> = ({
  assetType,
  assetTitle,
  assetSubtitle,
  recipient,
  amountOrQuantity,
  onConfirm,
  onClose,
  onSuccessDone,
}) => {
  const { currentChain, chainId } = useNetwork();
  const [status, setStatus] = useState<ExecutionStatus>("IDLE");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExecute = async () => {
    setStatus("PENDING");
    setErrorMessage(null);

    const result = await onConfirm();

    if (result.success && result.hash) {
      setTxHash(result.hash);
      setStatus("SUCCESS");
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00F293", "#00C2FF", "#ffffff"],
        });
      } catch {
        // Ignore confetti error
      }
    } else {
      setStatus("ERROR");
      setErrorMessage(result.error || "Transaction failed or was rejected.");
    }
  };

  return (
    <div className="space-y-4">
      {/* State 1: PENDING */}
      {status === "PENDING" && (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#00F293]/15 text-[#00F293] flex items-center justify-center mb-4 pending-pulse border border-[#00F293]/30">
            <Clock className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Transaction pending...</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Waiting for confirmation via World App MiniKit bridge.
          </p>
        </div>
      )}

      {/* State 2: SUCCESS */}
      {status === "SUCCESS" && (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Transaction confirmed</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            Successfully transferred {amountOrQuantity} {assetTitle} to {BlockchainClient.truncateAddress(recipient)}.
          </p>

          {txHash && (
            <a
              href={getExplorerTxUrl(chainId, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161922] hover:bg-[#202534] border border-[#222838] text-xs font-semibold text-slate-200 hover:text-white transition-colors mb-4"
            >
              <span>View transaction</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}

          <button
            onClick={onSuccessDone}
            type="button"
            className="w-full py-3.5 rounded-2xl world-glow-btn text-sm font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {/* State 3: ERROR */}
      {status === "ERROR" && (
        <div className="py-5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Transfer Failed</h3>
          <p className="text-xs text-rose-300 max-w-xs mb-4 bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40">
            {errorMessage}
          </p>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={onClose}
              type="button"
              className="py-3 rounded-xl bg-[#181B26] hover:bg-[#202534] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              type="button"
              className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* State 0: IDLE Confirmation Screen */}
      {status === "IDLE" && (
        <>
          {/* Main Transfer Overview */}
          <div className="p-4 rounded-2xl bg-[#141722] border border-[#1E2333] flex flex-col items-center text-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Send
            </span>
            <div className="text-2xl font-black text-white tracking-tight">
              {amountOrQuantity} {assetTitle}
            </div>
            {assetSubtitle && (
              <div className="text-xs text-slate-400 mt-0.5">{assetSubtitle}</div>
            )}
          </div>

          {/* Details Breakdown */}
          <div className="space-y-2.5 bg-[#141722] p-4 rounded-2xl border border-[#1E2333] text-xs">
            {/* Recipient */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">To</span>
              <span className="font-mono font-medium text-white">
                {BlockchainClient.truncateAddress(recipient, 8, 6)}
              </span>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network</span>
              <span className="font-semibold text-white">{currentChain.name}</span>
            </div>

            {/* Estimated Network Fee */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estimated network fee</span>
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sponsored by World App</span>
              </div>
            </div>
          </div>

          {/* World App Security Note */}
          <div className="p-3 rounded-xl bg-[#10141F] border border-[#1B2234] flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00F293] shrink-0 mt-0.5" />
            <span>
              Transactions are signed securely via World App. Private keys are never exposed.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleExecute}
              type="button"
              className="w-full py-3.5 rounded-2xl world-glow-btn text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirm transaction</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};
