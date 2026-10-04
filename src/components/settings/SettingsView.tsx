"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { useNetwork } from "@/context/NetworkContext";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { getWorldChainPermit2Tokens, getWorldPortalAllowlistText, WORLD_PERMIT2_ADDRESS } from "@/config/contracts";
import {
  Sparkles,
  Globe,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Info,
  LogOut,
  RefreshCw,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const {
    account,
    isInsideWorldApp,
    isSiweAuthenticated,
    signInWithSIWE,
    connect,
    disconnect,
  } = useWallet();
  const { demoMode, toggleDemoMode } = useDemoMode();
  const { currentChain, supportedNetworks, chainId, switchNetwork } = useNetwork();
  const [copied, setCopied] = useState(false);
  const [copiedAllowlist, setCopiedAllowlist] = useState(false);

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

  return (
    <div className="mx-4 mt-4 space-y-5">
      <div className="flex items-center justify-between mb-1 px-1">
        <h2 className="text-lg font-bold text-white tracking-tight">Settings</h2>
        <span className="text-xs text-slate-400">Nexora v1.0.0</span>
      </div>

      {/* 1. Demo Mode Switch */}
      <div className="p-4 rounded-3xl bg-[#12141A] border border-[#1E2230] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <span>Demo Mode</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${demoMode
                      ? "bg-amber-400/20 text-amber-300"
                      : "bg-slate-800 text-slate-400"
                    }`}
                >
                  {demoMode ? "ACTIVE" : "OFF"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate balances, NFTs, and zero-risk transactions.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={toggleDemoMode}
            type="button"
            className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer relative ${demoMode ? "bg-[#00F293]" : "bg-slate-700"
              }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#06070A] transition-transform ${demoMode ? "translate-x-6" : "translate-x-0"
                }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Network Selection */}
      <div className="p-4 rounded-3xl bg-[#12141A] border border-[#1E2230] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-[#00F293]" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Network Selection
          </h3>
        </div>
        <div className="space-y-2">
          {supportedNetworks.map((net) => {
            const isSelected = net.id === chainId;
            return (
              <button
                key={net.id}
                onClick={() => switchNetwork(net.id as 480 | 4801 | 10)}
                type="button"
                className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${isSelected
                    ? "bg-[#181C26] border-[#00F293]/40"
                    : "bg-[#141722] border-[#1E2333] hover:border-slate-700"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${net.testnet ? "bg-amber-400" : "bg-[#00F293]"
                      }`}
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-white block">
                      {net.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ID: {net.id} • {net.nativeCurrency.symbol}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#00F293]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. World MiniKit & SIWE Diagnostics */}
      <div className="p-4 rounded-3xl bg-[#12141A] border border-[#1E2230] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#00C2FF]" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              World MiniKit & SIWE
            </h3>
          </div>
          {isSiweAuthenticated ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SIWE Active
            </span>
          ) : (
            <button
              onClick={() => signInWithSIWE()}
              type="button"
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#00F293] text-[#06070A] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign In SIWE
            </button>
          )}
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722]">
            <span className="text-slate-400">Runtime Environment</span>
            <span className="font-semibold text-white">
              {isInsideWorldApp ? "World App Webview" : "Web / Standalone Browser"}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722]">
            <span className="text-slate-400">MiniKit Bridge Status</span>
            <span className="font-semibold text-[#00F293] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Installed (v2.x)</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722]">
            <span className="text-slate-400">World ID Human Proof</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00F293]" />
              <span>{account?.isWorldIdVerified ? "Verified Orb" : "Unverified"}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-[#12141A] border border-[#1E2230] shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          World App Transfer Permissions
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          `invalid_contract` is blocked by World App, not by Nexora. Add these addresses in Developer Portal → your Mini App → Permissions, then retry sendTransaction.
        </p>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#141722] text-slate-300">
            <div className="text-slate-500 mb-1">1. Contract Entrypoint — Permit2</div>
            <span className="font-mono break-all">{WORLD_PERMIT2_ADDRESS}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#141722] text-slate-300 space-y-1">
            <div className="text-slate-500 mb-1">2. Permit2 Tokens (and NFT contracts as Entrypoints)</div>
            {getWorldChainPermit2Tokens().map((token) => (
              <div key={token.address} className="font-mono break-all text-[11px] text-slate-400">
                {token.symbol}: {token.address}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(getWorldPortalAllowlistText());
                setCopiedAllowlist(true);
                setTimeout(() => setCopiedAllowlist(false), 2000);
              } catch {
                // Ignore
              }
            }}
            className="w-full py-2.5 rounded-xl bg-[#1A1E2B] hover:bg-[#22283A] text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedAllowlist ? <Check className="w-3.5 h-3.5 text-[#00F293]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAllowlist ? "Copied allowlist" : "Copy all addresses"}</span>
          </button>
          <a
            href="https://developer.world.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00F293] hover:underline flex items-center gap-1"
          >
            <span>Open Developer Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 4. Wallet Info & Disconnect */}
      <div className="p-4 rounded-3xl bg-[#12141A] border border-[#1E2230] shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Connected Account
        </h3>
        <div className="p-2.5 rounded-xl bg-[#141722] font-mono text-xs text-slate-300 break-all flex items-center justify-between mb-3">
          <span>{BlockchainClient.truncateAddress(address, 10, 8)}</span>
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#00F293]" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={connect}
            type="button"
            className="py-2.5 rounded-xl bg-[#1A1E2B] hover:bg-[#22283A] text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect</span>
          </button>
          <button
            onClick={disconnect}
            type="button"
            className="py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-900/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* 5. About & Documentation */}
      <div className="p-4 rounded-3xl bg-[#12141A] border border-[#1E2230] text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <Info className="w-4 h-4 text-slate-400" />
          <span>About Nexora Mini App</span>
        </div>
        <p>
          Nexora is an open-source, mobile-first Web3 wallet tailored for the World App ecosystem, designed to make managing tokens and NFT collectibles effortless.
        </p>
        <div className="pt-2 flex items-center gap-4">
          <a
            href={currentChain.blockExplorers.default.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00F293] hover:underline flex items-center gap-1"
          >
            <span>{currentChain.name} Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
