import { ChainConfig, SupportedChainId } from "@/types/network";

export const WORLD_CHAIN_MAINNET: ChainConfig = {
  id: 480,
  name: "World Chain",
  shortName: "World",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: "https://worldchain-mainnet.g.alchemy.com/public",
    public: "https://worldchain-mainnet.g.alchemy.com/public",
  },
  blockExplorers: {
    default: {
      name: "Worldscan",
      url: "https://worldscan.org",
    },
  },
  testnet: false,
  iconUrl: "/icons/worldchain.svg",
};

export const WORLD_CHAIN_SEPOLIA: ChainConfig = {
  id: 4801,
  name: "World Chain Sepolia",
  shortName: "Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: "https://worldchain-sepolia.g.alchemy.com/public",
    public: "https://worldchain-sepolia.g.alchemy.com/public",
  },
  blockExplorers: {
    default: {
      name: "Worldscan Sepolia",
      url: "https://sepolia.worldscan.org",
    },
  },
  testnet: true,
  iconUrl: "/icons/worldchain.svg",
};

export const OPTIMISM_MAINNET: ChainConfig = {
  id: 10,
  name: "OP Mainnet",
  shortName: "Optimism",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: "https://mainnet.optimism.io",
    public: "https://mainnet.optimism.io",
  },
  blockExplorers: {
    default: {
      name: "Optimism Etherscan",
      url: "https://optimistic.etherscan.io",
    },
  },
  testnet: false,
  iconUrl: "/icons/optimism.svg",
};

export const SUPPORTED_NETWORKS: Record<SupportedChainId, ChainConfig> = {
  480: WORLD_CHAIN_MAINNET,
  4801: WORLD_CHAIN_SEPOLIA,
  10: OPTIMISM_MAINNET,
};

export const DEFAULT_CHAIN_ID: SupportedChainId = 480;

const EXPLORER_API_URLS: Record<SupportedChainId, string> = {
  480: "https://worldchain-mainnet.explorer.alchemy.com/api",
  4801: "https://worldchain-sepolia.explorer.alchemy.com/api",
  10: "https://explorer.optimism.io/api",
};

export function getNetworkConfig(chainId: number): ChainConfig {
  if (chainId in SUPPORTED_NETWORKS) {
    return SUPPORTED_NETWORKS[chainId as SupportedChainId];
  }
  return WORLD_CHAIN_MAINNET;
}

export function getExplorerApiUrl(chainId: number): string | undefined {
  return EXPLORER_API_URLS[chainId as SupportedChainId];
}

export function getExplorerTxUrl(chainId: number, hash: string): string {
  const config = getNetworkConfig(chainId);
  return `${config.blockExplorers.default.url}/tx/${hash}`;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const config = getNetworkConfig(chainId);
  return `${config.blockExplorers.default.url}/address/${address}`;
}
