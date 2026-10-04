"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WalletAccount } from "@/types/wallet";
import { Token } from "@/types/token";
import { NFT } from "@/types/nft";
import { Transaction } from "@/types/transaction";
import { WorldMiniKitService } from "@/services/world/minikit";
import { ContractEncoder } from "@/contracts/encoder";
import { PERMIT2_ADDRESS } from "@/contracts/abis/permit2";
import { useDemoMode } from "./DemoModeContext";
import { useNetwork } from "./NetworkContext";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { NFTTransferabilityService } from "@/services/nfts/nft-transferability";

interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInsideWorldApp: boolean;
  isSiweAuthenticated: boolean;
  connect: () => Promise<void>;
  signInWithSIWE: () => Promise<boolean>;
  disconnect: () => void;
  sendToken: (params: {
    token: Token;
    recipient: string;
    amount: bigint;
  }) => Promise<{ success: boolean; hash?: string; error?: string }>;
  sendNFT: (params: {
    nft: NFT;
    recipient: string;
    quantity?: bigint;
  }) => Promise<{ success: boolean; hash?: string; error?: string }>;
  recentTransactions: Transaction[];
  clearRecentTransactions: () => void;
}

const DEFAULT_DEMO_ACCOUNT: WalletAccount = {
  address: "0x71C8b381034872910485720194857291048592FC",
  username: "alex.world",
  isWorldIdVerified: true,
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
};

const WalletContext = createContext<WalletContextType>({
  account: null,
  isConnected: false,
  isConnecting: false,
  isInsideWorldApp: false,
  isSiweAuthenticated: false,
  connect: async () => {},
  signInWithSIWE: async () => false,
  disconnect: () => {},
  sendToken: async () => ({ success: false, error: "Not initialized" }),
  sendNFT: async () => ({ success: false, error: "Not initialized" }),
  recentTransactions: [],
  clearRecentTransactions: () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { demoMode, setDemoMode } = useDemoMode();
  const { chainId } = useNetwork();

  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInsideWorldApp, setIsInsideWorldApp] = useState(false);
  const [isSiweAuthenticated, setIsSiweAuthenticated] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Initialize MiniKit and restore session on mount or demoMode change
  useEffect(() => {
    WorldMiniKitService.init();
    const inWorldApp = WorldMiniKitService.isInsideWorldApp();
    setIsInsideWorldApp(inWorldApp);

    // If Demo Mode is active, display default demo account
    if (demoMode) {
      setAccount(DEFAULT_DEMO_ACCOUNT);
      setIsSiweAuthenticated(true);
      return;
    }

    // In Live Mode (!demoMode):
    // 1. Check if authenticated account is persisted in localStorage
    try {
      const stored = localStorage.getItem("nexora_auth_account");
      if (stored) {
        const parsed = JSON.parse(stored) as WalletAccount;
        if (parsed && parsed.address) {
          setAccount(parsed);
          setIsSiweAuthenticated(true);
          return;
        }
      }
    } catch {
      // Ignore localStorage error
    }

    // 2. Check if MiniKit already has user info inside World App
    const currentUser = WorldMiniKitService.getCurrentUser();
    if (currentUser) {
      setAccount(currentUser);
      setIsSiweAuthenticated(true);
      try {
        localStorage.setItem("nexora_auth_account", JSON.stringify(currentUser));
      } catch {
        // Ignore
      }
      return;
    }

    // 3. Otherwise if inside World App, attempt auto-sign-in
    if (inWorldApp) {
      WorldMiniKitService.signInWithSIWE().then((acc) => {
        if (acc) {
          setAccount(acc);
          setIsSiweAuthenticated(true);
          try {
            localStorage.setItem("nexora_auth_account", JSON.stringify(acc));
          } catch {
            // Ignore
          }
        }
      });
    } else {
      setAccount(null);
      setIsSiweAuthenticated(false);
    }
  }, [demoMode]);

  const signInWithSIWE = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const authed = await WorldMiniKitService.signInWithSIWE();
      if (authed) {
        setAccount(authed);
        setIsSiweAuthenticated(true);
        // Persist session
        try {
          localStorage.setItem("nexora_auth_account", JSON.stringify(authed));
        } catch {
          // Ignore
        }
        // Exit demo mode to display live account assets
        setDemoMode(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("SIWE Error:", err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [setDemoMode]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Try official SIWE authentication
      const siweSuccess = await signInWithSIWE();
      if (siweSuccess) return;

      // Check MiniKit user
      const currentUser = WorldMiniKitService.getCurrentUser();
      if (currentUser) {
        setAccount(currentUser);
        setIsSiweAuthenticated(true);
        setDemoMode(false);
        try {
          localStorage.setItem("nexora_auth_account", JSON.stringify(currentUser));
        } catch {
          // Ignore
        }
        return;
      }

      // Browser fallback (e.g. window.ethereum if running in desktop browser)
      if (typeof window !== "undefined" && (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum) {
        const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          const browserAccount: WalletAccount = {
            address: accounts[0],
            username: "Browser Wallet",
            isWorldIdVerified: false,
          };
          setAccount(browserAccount);
          setIsSiweAuthenticated(false);
          setDemoMode(false);
          try {
            localStorage.setItem("nexora_auth_account", JSON.stringify(browserAccount));
          } catch {
            // Ignore
          }
          return;
        }
      }

      // If demo mode was active, preserve demo account
      if (demoMode) {
        setAccount(DEFAULT_DEMO_ACCOUNT);
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [demoMode, signInWithSIWE, setDemoMode]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setIsSiweAuthenticated(false);
    try {
      localStorage.removeItem("nexora_auth_account");
    } catch {
      // Ignore
    }
  }, []);

  const addLocalTransaction = useCallback((tx: Transaction) => {
    setRecentTransactions((prev) => [tx, ...prev]);
  }, []);

  const updateTransactionStatus = useCallback((hash: string, status: "PENDING" | "CONFIRMED" | "FAILED", errorMessage?: string) => {
    setRecentTransactions((prev) =>
      prev.map((tx) => (tx.hash === hash ? { ...tx, status, errorMessage } : tx))
    );
  }, []);

  const clearRecentTransactions = useCallback(() => {
    setRecentTransactions([]);
  }, []);

  /**
   * Send Token transfer
   */
  const sendToken = useCallback(
    async (params: {
      token: Token;
      recipient: string;
      amount: bigint;
    }): Promise<{ success: boolean; hash?: string; error?: string }> => {
      const { token, recipient, amount } = params;

      if (!account?.address) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!BlockchainClient.isValidAddress(recipient)) {
        return { success: false, error: "Invalid recipient address" };
      }

      if (amount <= BigInt(0)) {
        return { success: false, error: "Transfer amount must be greater than zero" };
      }

      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      // Register as pending in local transactions
      const newTx: Transaction = {
        hash: txHash,
        type: "TOKEN_SEND",
        status: "PENDING",
        from: account.address,
        to: recipient,
        assetSymbol: token.symbol,
        assetName: token.name,
        amount: BlockchainClient.formatUnits(amount, token.decimals),
        contractAddress: token.address,
        timestamp: Date.now(),
        chainId,
      };

      addLocalTransaction(newTx);

      // In Demo Mode: simulate realistic async confirmation
      if (demoMode) {
        return new Promise((resolve) => {
          setTimeout(() => {
            updateTransactionStatus(txHash, "CONFIRMED");
            resolve({ success: true, hash: txHash });
          }, 2000);
        });
      }

      // If in World App: use MiniKit sendTransaction
      try {
        if (token.isNative) {
          // Native ETH transfer via sendTransaction to the recipient
          const result = await WorldMiniKitService.executeSendTransaction({
            chainId,
            transactions: [
              {
                address: recipient as `0x${string}`,
                data: "0x",
                value: amount,
              },
            ],
          });

          if (result.success && result.transactionHash) {
            updateTransactionStatus(txHash, "CONFIRMED");
            return { success: true, hash: result.transactionHash };
          } else {
            const errMsg = result.error || "Transaction was rejected in World App";
            updateTransactionStatus(txHash, "FAILED", errMsg);
            return { success: false, error: errMsg };
          }
        } else {
          // ERC-20 via Permit2 AllowanceTransfer so MiniKit does not call the
          // token contract as an entrypoint (avoids invalid_contract).
          const permitAmount = ContractEncoder.toPermit2Amount(amount);
          const approveData = ContractEncoder.encodePermit2Approve(
            token.address,
            account.address,
            permitAmount
          );
          const transferData = ContractEncoder.encodePermit2TransferFrom(
            account.address,
            recipient,
            permitAmount,
            token.address
          );

          const result = await WorldMiniKitService.executeSendTransaction({
            chainId,
            transactions: [
              {
                address: PERMIT2_ADDRESS,
                data: approveData,
              },
              {
                address: PERMIT2_ADDRESS,
                data: transferData,
              },
            ],
          });

          if (result.success && result.transactionHash) {
            updateTransactionStatus(txHash, "CONFIRMED");
            return { success: true, hash: result.transactionHash };
          } else {
            const errMsg = result.error || "Transaction was rejected in World App";
            updateTransactionStatus(txHash, "FAILED", errMsg);
            return { success: false, error: errMsg };
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Blockchain execution error";
        updateTransactionStatus(txHash, "FAILED", errMsg);
        return { success: false, error: errMsg };
      }
    },
    [account, chainId, demoMode, addLocalTransaction, updateTransactionStatus]
  );

  /**
   * Send NFT transfer (ERC-721 or ERC-1155)
   */
  const sendNFT = useCallback(
    async (params: {
      nft: NFT;
      recipient: string;
      quantity?: bigint;
    }): Promise<{ success: boolean; hash?: string; error?: string }> => {
      const { nft, recipient, quantity = BigInt(1) } = params;

      if (!account?.address) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!BlockchainClient.isValidAddress(recipient)) {
        return { success: false, error: "Invalid recipient address" };
      }

      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      // Register as pending
      const newTx: Transaction = {
        hash: txHash,
        type: "NFT_SEND",
        status: "PENDING",
        from: account.address,
        to: recipient,
        assetName: nft.name || `Token #${nft.tokenId}`,
        tokenId: nft.tokenId,
        standard: nft.standard,
        contractAddress: nft.contractAddress,
        amount: nft.standard === "ERC1155" ? quantity.toString() : "1",
        timestamp: Date.now(),
        chainId,
      };

      addLocalTransaction(newTx);

      // Demo Mode simulation
      if (demoMode) {
        return new Promise((resolve) => {
          setTimeout(() => {
            updateTransactionStatus(txHash, "CONFIRMED");
            resolve({ success: true, hash: txHash });
          }, 2000);
        });
      }

      // Live World App execution via MiniKit sendTransaction
      try {
        const preflight = await NFTTransferabilityService.simulateTransfer({
          nft,
          from: account.address,
          to: recipient,
          quantity,
          chainId,
        });

        if (preflight.status === "non_transferable") {
          updateTransactionStatus(txHash, "FAILED", preflight.reason);
          return { success: false, error: preflight.reason };
        }

        let calldata: `0x${string}`;

        if (nft.standard === "ERC721") {
          calldata = ContractEncoder.encodeErc721Transfer(
            account.address,
            recipient,
            BigInt(nft.tokenId)
          );
        } else {
          calldata = ContractEncoder.encodeErc1155Transfer(
            account.address,
            recipient,
            BigInt(nft.tokenId),
            quantity
          );
        }

        const result = await WorldMiniKitService.executeSendTransaction({
          chainId,
          transactions: [
            {
              address: nft.contractAddress as `0x${string}`,
              data: calldata,
            },
          ],
        });

        if (result.success && result.transactionHash) {
          updateTransactionStatus(txHash, "CONFIRMED");
          return { success: true, hash: result.transactionHash };
        } else {
          const errMsg = result.error || "NFT Transfer was rejected in World App";
          updateTransactionStatus(txHash, "FAILED", errMsg);
          return { success: false, error: errMsg };
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "NFT transfer execution failed";
        updateTransactionStatus(txHash, "FAILED", errMsg);
        return { success: false, error: errMsg };
      }
    },
    [account, chainId, demoMode, addLocalTransaction, updateTransactionStatus]
  );

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected: !!account,
        isConnecting,
        isInsideWorldApp,
        isSiweAuthenticated,
        connect,
        signInWithSIWE,
        disconnect,
        sendToken,
        sendNFT,
        recentTransactions,
        clearRecentTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
