"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { CustomTokenService } from "@/services/tokens/custom-tokens";
import { PricingService } from "@/services/pricing/pricing-service";
import { useWallet } from "@/context/WalletContext";
import { useNetwork } from "@/context/NetworkContext";
import { KnownTokenConfig } from "@/config/contracts";
import { Coins, Check, AlertCircle, Loader2, ClipboardPaste, Plus } from "lucide-react";

interface ImportTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenImported: () => void;
}

export const ImportTokenModal: React.FC<ImportTokenModalProps> = ({
  isOpen,
  onClose,
  onTokenImported,
}) => {
  const { account } = useWallet();
  const { chainId, currentChain } = useNetwork();

  const [contractAddress, setContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredToken, setDiscoveredToken] = useState<{
    name: string;
    symbol: string;
    decimals: number;
    balance: bigint;
    price?: number;
  } | null>(null);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setContractAddress("");
      setError(null);
      setDiscoveredToken(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle address input and automatic inspection
  const handleAddressChange = async (value: string) => {
    const clean = value.trim();
    setContractAddress(clean);
    setError(null);
    setDiscoveredToken(null);

    if (BlockchainClient.isValidAddress(clean)) {
      setIsLoading(true);
      try {
        const metadata = await BlockchainClient.getErc20Metadata(clean, chainId);
        if (!metadata) {
          setError(`No valid ERC-20 contract found at this address on ${currentChain.name}.`);
          setIsLoading(false);
          return;
        }

        let userBalance = BigInt(0);
        if (account?.address) {
          userBalance = await BlockchainClient.getErc20Balance(clean, account.address, chainId);
        }

        // Try to fetch live market price
        await PricingService.fetchLivePrices([{ address: clean, symbol: metadata.symbol }]);
        const priceInfo = PricingService.getPrice(clean) || PricingService.getPrice(metadata.symbol);

        setDiscoveredToken({
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          balance: userBalance,
          price: priceInfo?.usdPrice,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error reading token contract";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleAddressChange(text);
      }
    } catch {
      // Ignore clipboard read error
    }
  };

  const handleImport = () => {
    if (!discoveredToken || !BlockchainClient.isValidAddress(contractAddress)) return;

    const tokenConfig: KnownTokenConfig = {
      address: contractAddress,
      name: discoveredToken.name,
      symbol: discoveredToken.symbol,
      decimals: discoveredToken.decimals,
      logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${discoveredToken.symbol}`,
      chainId,
    };

    CustomTokenService.addCustomToken(tokenConfig);
    onTokenImported();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Custom Token">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Enter any ERC-20 token contract address deployed on{" "}
          <span className="text-[#00F293] font-semibold">{currentChain.name}</span> to track its
          balance and live market value.
        </p>

        {/* Contract Address Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Contract Address
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="0x..."
              className="w-full px-3.5 py-3 pr-10 rounded-2xl bg-[#141722] border border-[#222736] focus:border-[#00F293] text-white text-xs font-mono placeholder:text-slate-600 outline-none transition-all"
            />
            <button
              onClick={handlePaste}
              type="button"
              title="Paste from clipboard"
              className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-[#141722] border border-[#222736] flex items-center justify-center gap-2.5 text-xs text-slate-300">
            <Loader2 className="w-4 h-4 text-[#00F293] animate-spin" />
            <span>Inspecting contract on {currentChain.name}...</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Discovered Token Preview */}
        {discoveredToken && (
          <div className="p-3.5 rounded-2xl bg-[#141722] border border-[#00F293]/30 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1A1E2B] border border-white/10 flex items-center justify-center font-bold text-xs text-[#00F293]">
                  {discoveredToken.symbol.slice(0, 3)}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">
                    {discoveredToken.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {discoveredToken.symbol} • {discoveredToken.decimals} decimals
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00F293]/15 text-[#00F293] border border-[#00F293]/30">
                VERIFIED
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Your Wallet Balance:</span>
              <span className="font-mono font-semibold text-white">
                {PricingService.formatTokenAmount(
                  discoveredToken.balance,
                  discoveredToken.decimals
                )}{" "}
                {discoveredToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Market Price:</span>
              <span className="font-mono text-slate-200">
                {discoveredToken.price
                  ? PricingService.formatPrice(discoveredToken.price)
                  : "Price unavailable"}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleImport}
          disabled={!discoveredToken}
          type="button"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00F293] to-[#00C2FF] text-[#06070A] font-bold text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Import Token to Wallet</span>
        </button>
      </div>
    </Modal>
  );
};
