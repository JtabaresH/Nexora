"use client";

import React, { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, NavTab } from "@/components/layout/BottomNav";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { PortfolioCard } from "@/components/wallet/PortfolioCard";
import { TokenList } from "@/components/tokens/TokenList";
import { NFTGrid } from "@/components/nfts/NFTGrid";
import { NFTDetailModal } from "@/components/nfts/NFTDetailModal";
import { TransactionList } from "@/components/activity/TransactionList";
import { SettingsView } from "@/components/settings/SettingsView";
import { SendModal } from "@/components/send/SendModal";
import { ReceiveModal } from "@/components/receive/ReceiveModal";
import { useTokens } from "@/hooks/useTokens";
import { Token } from "@/types/token";
import { NFT } from "@/types/nft";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("HOME");

  // Modals state
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedNFTForDetail, setSelectedNFTForDetail] = useState<NFT | null>(null);

  // Preselected assets for Send
  const [preselectedToken, setPreselectedToken] = useState<Token | undefined>(undefined);
  const [preselectedNFT, setPreselectedNFT] = useState<NFT | undefined>(undefined);

  const {
    tokens,
    formattedPortfolioValue,
    isLoading: isTokensLoading,
    isError: isTokensError,
    refetch: refetchTokens,
  } = useTokens();

  // Handlers
  const handleOpenSend = (token?: Token, nft?: NFT) => {
    setPreselectedToken(token);
    setPreselectedNFT(nft);
    setIsSendOpen(true);
  };

  const handleOpenReceive = () => {
    setIsReceiveOpen(true);
  };

  const handleOpenSendReceiveMenu = () => {
    // Open generic Send dialog or prompt
    handleOpenSend();
  };

  return (
    <>
      <AppHeader />
      <DemoBanner />

      <div className="flex-1 pb-6">
        {/* TAB 1: HOME */}
        {activeTab === "HOME" && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <PortfolioCard
              portfolioValue={formattedPortfolioValue}
              onSend={() => handleOpenSend()}
              onReceive={handleOpenReceive}
              onGoNFTs={() => setActiveTab("NFTS")}
              onGoActivity={() => setActiveTab("ACTIVITY")}
            />
            <TokenList
              tokens={tokens}
              isLoading={isTokensLoading}
              isError={isTokensError}
              onRetry={refetchTokens}
              onSelectToken={(token) => handleOpenSend(token, undefined)}
            />
          </div>
        )}

        {/* TAB 2: NFTS (Grouped by Collection) */}
        {activeTab === "NFTS" && (
          <div className="animate-in fade-in duration-200">
            <NFTGrid
              onViewDetails={(nft) => setSelectedNFTForDetail(nft)}
              onSend={(nft) => handleOpenSend(undefined, nft)}
            />
          </div>
        )}

        {/* TAB 3: ACTIVITY */}
        {activeTab === "ACTIVITY" && (
          <div className="animate-in fade-in duration-200">
            <TransactionList />
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "SETTINGS" && (
          <div className="animate-in fade-in duration-200">
            <SettingsView />
          </div>
        )}
      </div>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSendReceive={handleOpenSendReceiveMenu}
      />

      {/* Send Modal */}
      <SendModal
        isOpen={isSendOpen}
        onClose={() => {
          setIsSendOpen(false);
          setPreselectedToken(undefined);
          setPreselectedNFT(undefined);
        }}
        preselectedToken={preselectedToken}
        preselectedNFT={preselectedNFT}
      />

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
      />

      {/* NFT Detail Modal */}
      <NFTDetailModal
        nft={selectedNFTForDetail}
        isOpen={!!selectedNFTForDetail}
        onClose={() => setSelectedNFTForDetail(null)}
        onSend={(nft) => {
          setSelectedNFTForDetail(null);
          handleOpenSend(undefined, nft);
        }}
      />
    </>
  );
}
