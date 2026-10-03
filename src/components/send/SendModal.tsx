"use client";

import React, { useState, useEffect } from "react";
import { Token } from "@/types/token";
import { NFT } from "@/types/nft";
import { useWallet } from "@/context/WalletContext";
import { useTokens } from "@/hooks/useTokens";
import { useNFTs } from "@/hooks/useNFTs";
import { Modal } from "../common/Modal";
import { SendTokenForm } from "./SendTokenForm";
import { SendNFTForm } from "./SendNFTForm";
import { ConfirmTransactionModal } from "./ConfirmTransactionModal";
import { Coins, Image as ImageIcon, ArrowLeft } from "lucide-react";

type SendStep = "SELECT_TYPE" | "FORM" | "CONFIRM";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssetType?: "TOKEN" | "NFT";
  preselectedToken?: Token;
  preselectedNFT?: NFT;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  initialAssetType,
  preselectedToken,
  preselectedNFT,
}) => {
  const { sendToken, sendNFT } = useWallet();
  const { tokens } = useTokens();
  const { nfts } = useNFTs();

  const [step, setStep] = useState<SendStep>("SELECT_TYPE");
  const [assetType, setAssetType] = useState<"TOKEN" | "NFT">("TOKEN");

  // Prepared data for confirmation
  const [confirmData, setConfirmData] = useState<{
    assetType: "TOKEN" | "NFT";
    assetTitle: string;
    assetSubtitle?: string;
    recipient: string;
    amountOrQuantity: string;
    execute: () => Promise<{ success: boolean; hash?: string; error?: string }>;
  } | null>(null);

  // Set initial state based on props
  useEffect(() => {
    if (isOpen) {
      if (preselectedNFT) {
        setAssetType("NFT");
        setStep("FORM");
      } else if (preselectedToken) {
        setAssetType("TOKEN");
        setStep("FORM");
      } else if (initialAssetType) {
        setAssetType(initialAssetType);
        setStep("FORM");
      } else {
        setStep("SELECT_TYPE");
      }
      setConfirmData(null);
    }
  }, [isOpen, initialAssetType, preselectedToken, preselectedNFT]);

  const handleSelectType = (type: "TOKEN" | "NFT") => {
    setAssetType(type);
    setStep("FORM");
  };

  const handleTokenFormProceed = (data: {
    token: Token;
    recipient: string;
    amount: bigint;
    humanAmount: string;
  }) => {
    setConfirmData({
      assetType: "TOKEN",
      assetTitle: data.token.symbol,
      assetSubtitle: data.token.name,
      recipient: data.recipient,
      amountOrQuantity: data.humanAmount,
      execute: async () => {
        return await sendToken({
          token: data.token,
          recipient: data.recipient,
          amount: data.amount,
        });
      },
    });
    setStep("CONFIRM");
  };

  const handleNFTFormProceed = (data: {
    nft: NFT;
    recipient: string;
    quantity: bigint;
  }) => {
    setConfirmData({
      assetType: "NFT",
      assetTitle: data.nft.name || `Token #${data.nft.tokenId}`,
      assetSubtitle: `${data.nft.standard} • ${data.nft.collectionName || "Collectible"}`,
      recipient: data.recipient,
      amountOrQuantity: data.nft.standard === "ERC1155" ? data.quantity.toString() : "1",
      execute: async () => {
        return await sendNFT({
          nft: data.nft,
          recipient: data.recipient,
          quantity: data.quantity,
        });
      },
    });
    setStep("CONFIRM");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === "CONFIRM"
          ? "Confirm Send"
          : step === "FORM"
          ? `Send ${assetType === "TOKEN" ? "Token" : "NFT"}`
          : "What do you want to send?"
      }
    >
      <div>
        {/* Back navigation button if in FORM or CONFIRM and started from type select */}
        {step === "FORM" && !preselectedToken && !preselectedNFT && (
          <button
            onClick={() => setStep("SELECT_TYPE")}
            type="button"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to asset selection</span>
          </button>
        )}

        {/* STEP 1: Select Type */}
        {step === "SELECT_TYPE" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400 text-center mb-4">
              Choose the category of asset you wish to transfer.
            </p>

            <button
              onClick={() => handleSelectType("TOKEN")}
              type="button"
              className="w-full p-4 rounded-2xl bg-[#141722] hover:bg-[#1C2030] border border-[#202536] hover:border-[#00F293]/40 flex items-center justify-between transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#00F293]/15 text-[#00F293] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Coins className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">Token</div>
                  <div className="text-xs text-slate-400">
                    WLD, USDC, ETH, or custom ERC-20
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-[#00F293]">
                Select →
              </span>
            </button>

            <button
              onClick={() => handleSelectType("NFT")}
              type="button"
              className="w-full p-4 rounded-2xl bg-[#141722] hover:bg-[#1C2030] border border-[#202536] hover:border-[#00F293]/40 flex items-center justify-between transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#00C2FF]/15 text-[#00C2FF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">NFT Collectible</div>
                  <div className="text-xs text-slate-400">
                    ERC-721 or ERC-1155 Digital Art & Passes
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-[#00C2FF]">
                Select →
              </span>
            </button>
          </div>
        )}

        {/* STEP 2: Form */}
        {step === "FORM" && assetType === "TOKEN" && (
          <SendTokenForm
            tokens={tokens}
            preselectedToken={preselectedToken}
            onProceedToConfirm={handleTokenFormProceed}
          />
        )}

        {step === "FORM" && assetType === "NFT" && (
          <SendNFTForm
            nfts={nfts}
            preselectedNFT={preselectedNFT}
            onProceedToConfirm={handleNFTFormProceed}
          />
        )}

        {/* STEP 3: Confirm & Live State Machine */}
        {step === "CONFIRM" && confirmData && (
          <ConfirmTransactionModal
            assetType={confirmData.assetType}
            assetTitle={confirmData.assetTitle}
            assetSubtitle={confirmData.assetSubtitle}
            recipient={confirmData.recipient}
            amountOrQuantity={confirmData.amountOrQuantity}
            onConfirm={confirmData.execute}
            onClose={onClose}
            onSuccessDone={onClose}
          />
        )}
      </div>
    </Modal>
  );
};
