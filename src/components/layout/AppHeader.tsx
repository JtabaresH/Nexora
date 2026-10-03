"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { useNetwork } from "@/context/NetworkContext";
import { NetworkBadge } from "../common/NetworkBadge";
import { AddressDisplay } from "../common/AddressDisplay";
import { Modal } from "../common/Modal";
import { QRCodeDisplay } from "../common/QRCodeDisplay";
import { ShieldCheck, Sparkles, Check, Copy } from "lucide-react";
import Image from "next/image";

export const AppHeader: React.FC = () => {
  const { account, isConnected, connect } = useWallet();
  const { demoMode, toggleDemoMode } = useDemoMode();
  const { supportedNetworks, chainId, switchNetwork } = useNetwork();

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const address = account?.address || "0x0000000000000000000000000000000000000000";

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <>
      <header className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-[#161922] bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-30">
        {/* Left: User Identity */}
        <div className="flex items-center gap-2.5">
          {isConnected && account ? (
            <>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00F293]/30 to-[#00C2FF]/30 p-0.5 border border-white/10 shadow-sm flex items-center justify-center overflow-hidden">
                  {account?.avatarUrl ? (
                    <Image
                      src={account.avatarUrl}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1A1D27] flex items-center justify-center font-bold text-xs text-[#00F293]">
                      {account?.username ? account.username.slice(0, 2).toUpperCase() : "W3"}
                    </div>
                  )}
                </div>
                {account?.isWorldIdVerified && (
                  <div
                    title="World ID Verified Human"
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00F293] border-2 border-[#0A0B0E] flex items-center justify-center"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-[#050608]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-white leading-tight">
                    {account?.username || "World Account"}
                  </span>
                  {demoMode ? (
                    <button
                      onClick={toggleDemoMode}
                      title="Click to toggle Demo Mode"
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/20 transition-all cursor-pointer"
                    >
                      DEMO
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#00F293]/10 text-[#00F293] border border-[#00F293]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F293] animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <AddressDisplay
                  address={address}
                  onViewFull={() => setShowAddressModal(true)}
                  className="mt-0.5"
                />
              </div>
            </>
          ) : (
            <button
              onClick={connect}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00F293] to-[#00C2FF] text-[#06070A] font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect World ID</span>
            </button>
          )}
        </div>

        {/* Right: Network Badge */}
        <div className="flex items-center gap-2">
          <NetworkBadge
            onClick={() => setShowNetworkModal(true)}
            showSelectorArrow
          />
        </div>
      </header>

      {/* Full Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Wallet Address"
      >
        <div className="flex flex-col items-center text-center">
          <QRCodeDisplay value={address} size={180} className="mb-4" />
          <p className="text-xs text-slate-400 mb-2">Your World Chain wallet address</p>
          <div className="w-full p-3 rounded-xl bg-[#161922] border border-[#222736] font-mono text-xs text-slate-200 break-all select-all mb-4">
            {address}
          </div>
          <button
            onClick={handleCopyFull}
            type="button"
            className="w-full py-3 rounded-xl bg-[#1E2230] hover:bg-[#282E40] text-white text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedFull ? (
              <>
                <Check className="w-4 h-4 text-[#00F293]" />
                <span className="text-[#00F293]">Address Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Full Address</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Network Switcher Modal */}
      <Modal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        title="Select Network"
      >
        <div className="space-y-2">
          {supportedNetworks.map((net) => {
            const isSelected = net.id === chainId;
            return (
              <button
                key={net.id}
                onClick={() => {
                  switchNetwork(net.id as 480 | 4801 | 10);
                  setShowNetworkModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#181C26] border-[#00F293]/40 shadow-sm"
                    : "bg-[#12141A] border-[#1E2230] hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      net.testnet ? "bg-amber-400" : "bg-[#00F293]"
                    }`}
                  />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{net.name}</div>
                    <div className="text-xs text-slate-400">Chain ID: {net.id}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#00F293]" />}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
};
