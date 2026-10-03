"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ChainConfig, SupportedChainId } from "@/types/network";
import { DEFAULT_CHAIN_ID, getNetworkConfig, SUPPORTED_NETWORKS } from "@/config/networks";

interface NetworkContextType {
  chainId: SupportedChainId;
  currentChain: ChainConfig;
  switchNetwork: (chainId: SupportedChainId) => void;
  supportedNetworks: ChainConfig[];
}

const NetworkContext = createContext<NetworkContextType>({
  chainId: DEFAULT_CHAIN_ID,
  currentChain: getNetworkConfig(DEFAULT_CHAIN_ID),
  switchNetwork: () => {},
  supportedNetworks: Object.values(SUPPORTED_NETWORKS),
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chainId, setChainId] = useState<SupportedChainId>(DEFAULT_CHAIN_ID);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nexora_chain_id");
      if (stored && Number(stored) in SUPPORTED_NETWORKS) {
        setChainId(Number(stored) as SupportedChainId);
      }
    } catch {
      // Ignore
    }
  }, []);

  const switchNetwork = (newChainId: SupportedChainId) => {
    if (newChainId in SUPPORTED_NETWORKS) {
      setChainId(newChainId);
      try {
        localStorage.setItem("nexora_chain_id", String(newChainId));
      } catch {
        // Ignore
      }
    }
  };

  const currentChain = getNetworkConfig(chainId);
  const supportedNetworks = Object.values(SUPPORTED_NETWORKS);

  return (
    <NetworkContext.Provider
      value={{
        chainId,
        currentChain,
        switchNetwork,
        supportedNetworks,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
