"use client";

import React, { useState } from "react";
import { Token } from "@/types/token";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { PricingService } from "@/services/pricing/pricing-service";
import { addressSchema, tokenTransferSchema } from "@/utils/validation";
import { Coins, ChevronDown, AlertCircle } from "lucide-react";
import Image from "next/image";

interface SendTokenFormProps {
  tokens: Token[];
  preselectedToken?: Token;
  onProceedToConfirm: (data: {
    token: Token;
    recipient: string;
    amount: bigint;
    humanAmount: string;
  }) => void;
}

export const SendTokenForm: React.FC<SendTokenFormProps> = ({
  tokens,
  preselectedToken,
  onProceedToConfirm,
}) => {
  const [selectedToken, setSelectedToken] = useState<Token>(
    preselectedToken || tokens[0] || ({} as Token)
  );
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formattedBalance = PricingService.formatTokenAmount(
    selectedToken.balance,
    selectedToken.decimals
  );

  const handleMax = () => {
    const maxStr = BlockchainClient.formatUnits(
      selectedToken.balance,
      selectedToken.decimals
    );
    setAmount(maxStr);
    setError(null);
  };

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

    // Validate using Zod
    const validation = tokenTransferSchema.safeParse({ recipient, amount });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid input");
      return;
    }

    try {
      const parsedAmount = BlockchainClient.parseTokenAmount(
        amount,
        selectedToken.decimals
      );

      if (parsedAmount <= BigInt(0)) {
        setError("Amount must be greater than zero.");
        return;
      }

      if (parsedAmount > selectedToken.balance) {
        setError("Insufficient balance for this transfer.");
        return;
      }

      onProceedToConfirm({
        token: selectedToken,
        recipient: recipient.trim(),
        amount: parsedAmount,
        humanAmount: amount,
      });
    } catch {
      setError("Invalid amount format.");
    }
  };

  // USD equivalent calculation
  const calculatedUsd =
    selectedToken.usdPrice && Number(amount) > 0
      ? (Number(amount) * selectedToken.usdPrice).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Asset Selection */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Select Asset
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTokenSelector(!showTokenSelector)}
            className="w-full p-3 rounded-2xl bg-[#141722] border border-[#1E2333] hover:border-slate-600 flex items-center justify-between text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1A1D27] flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                {selectedToken.logoUrl ? (
                  <Image
                    src={selectedToken.logoUrl}
                    alt={selectedToken.symbol}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Coins className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                  <span>{selectedToken.name}</span>
                  <span className="text-xs text-slate-400">({selectedToken.symbol})</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Balance: {formattedBalance} {selectedToken.symbol}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Token Dropdown */}
          {showTokenSelector && (
            <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-[#161922] border border-[#222838] rounded-2xl shadow-2xl z-20 space-y-1">
              {tokens.map((t) => (
                <button
                  key={`${t.chainId}-${t.address}`}
                  type="button"
                  onClick={() => {
                    setSelectedToken(t);
                    setShowTokenSelector(false);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-[#202534] flex items-center justify-between transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden">
                      {t.logoUrl && (
                        <Image
                          src={t.logoUrl}
                          alt={t.symbol}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-white">{t.symbol}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {PricingService.formatTokenAmount(t.balance, t.decimals)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Recipient Address */}
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

      {/* 3. Amount */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Amount
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">
              Avail: {formattedBalance}
            </span>
            <button
              type="button"
              onClick={handleMax}
              className="text-[10px] font-bold text-[#00F293] bg-[#00F293]/10 hover:bg-[#00F293]/20 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className="w-full p-3.5 pr-16 rounded-2xl bg-[#141722] border border-[#1E2333] focus:border-[#00F293] outline-none text-base font-semibold text-white placeholder-slate-500 transition-colors"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {selectedToken.symbol}
          </div>
        </div>

        {calculatedUsd && (
          <div className="text-[11px] text-slate-400 mt-1 pl-1">
            Approx. {calculatedUsd}
          </div>
        )}
      </div>

      {/* Error message display */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/40 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl world-glow-btn text-sm font-bold cursor-pointer mt-4"
      >
        Review Transfer
      </button>
    </form>
  );
};
