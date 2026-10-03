import { AssetProvider } from "./types";
import { Token } from "@/types/token";
import { NFT } from "@/types/nft";
import { Transaction } from "@/types/transaction";
import { BlockchainClient } from "../blockchain/viem-client";
import { KNOWN_TOKENS_WORLD_CHAIN, KNOWN_TOKENS_SEPOLIA, KNOWN_TOKENS_OPTIMISM } from "@/config/contracts";
import { PricingService } from "../pricing/pricing-service";
import { CustomTokenService } from "../tokens/custom-tokens";

export class OnChainAssetProvider implements AssetProvider {
  async getTokens(address: string, chainId: number): Promise<Token[]> {
    if (!BlockchainClient.isValidAddress(address)) {
      return [];
    }

    let baseConfigs = KNOWN_TOKENS_WORLD_CHAIN;
    if (chainId === 4801) {
      baseConfigs = KNOWN_TOKENS_SEPOLIA;
    } else if (chainId === 10) {
      baseConfigs = KNOWN_TOKENS_OPTIMISM;
    }

    // 1. Merge with any user-imported custom tokens
    const customConfigs = CustomTokenService.getCustomTokens(chainId);
    const allConfigs = [...baseConfigs, ...customConfigs];

    // 2. Fetch live real-time market prices from DexScreener & DefiLlama
    await PricingService.fetchLivePrices(allConfigs);

    // 3. Query on-chain balances in parallel
    const tokens: Token[] = await Promise.all(
      allConfigs.map(async (config) => {
        let balance = BigInt(0);

        try {
          if (config.isNative) {
            balance = await BlockchainClient.getNativeBalance(address, chainId);
          } else {
            balance = await BlockchainClient.getErc20Balance(config.address, address, chainId);
          }
        } catch (err) {
          console.warn(`Failed to fetch balance for ${config.symbol}:`, err);
        }

        const priceInfo =
          PricingService.getPrice(config.address) ||
          PricingService.getPrice(config.symbol);

        return {
          address: config.address,
          name: config.name,
          symbol: config.symbol,
          decimals: config.decimals,
          balance,
          logoUrl: config.logoUrl,
          chainId,
          usdPrice: priceInfo?.usdPrice,
          priceChange24h: priceInfo?.change24h,
          isNative: config.isNative,
          isCustom: customConfigs.some(
            (c) => c.address.toLowerCase() === config.address.toLowerCase()
          ),
        };
      })
    );

    // 4. Sort tokens: tokens with positive balance first (by USD valuation descending), then remaining assets
    tokens.sort((a, b) => {
      const aHasBalance = a.balance > BigInt(0);
      const bHasBalance = b.balance > BigInt(0);

      if (aHasBalance && !bHasBalance) return -1;
      if (!aHasBalance && bHasBalance) return 1;

      if (aHasBalance && bHasBalance) {
        const aVal = (Number(a.balance) / 10 ** a.decimals) * (a.usdPrice || 0);
        const bVal = (Number(b.balance) / 10 ** b.decimals) * (b.usdPrice || 0);
        if (aVal !== bVal) return bVal - aVal;
      }

      // Prioritize WLD and ETH in default zero-balance view
      if (a.symbol === "WLD") return -1;
      if (b.symbol === "WLD") return 1;
      if (a.symbol === "ETH") return -1;
      if (b.symbol === "ETH") return 1;

      return 0;
    });

    return tokens;
  }

  async getNFTs(address: string, chainId: number): Promise<NFT[]> {
    if (!BlockchainClient.isValidAddress(address)) {
      return [];
    }

    try {
      // Call our server-side API route which handles Alchemy + Worldscan indexing
      const res = await fetch(
        `/api/nfts?address=${encodeURIComponent(address)}&chainId=${chainId}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!res.ok) {
        console.warn(`NFT API returned ${res.status}`);
        return [];
      }

      const data = await res.json();

      if (!data.nfts || !Array.isArray(data.nfts)) {
        return [];
      }

      // Deserialize BigInt quantity from string
      return data.nfts.map((nft: NFT & { quantity: string | bigint }) => ({
        ...nft,
        quantity: typeof nft.quantity === "string" ? BigInt(nft.quantity) : (nft.quantity || BigInt(1)),
      }));
    } catch (err) {
      console.warn("Failed to fetch NFTs from indexer:", err);
      return [];
    }
  }

  async getTransactions(address: string, chainId: number): Promise<Transaction[]> {
    if (!BlockchainClient.isValidAddress(address)) {
      return [];
    }

    try {
      // Call our server-side API route which handles Worldscan indexing
      const res = await fetch(
        `/api/transactions?address=${encodeURIComponent(address)}&chainId=${chainId}&limit=50`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!res.ok) {
        console.warn(`Transaction API returned ${res.status}`);
        return [];
      }

      const data = await res.json();

      if (!data.transactions || !Array.isArray(data.transactions)) {
        return [];
      }

      return data.transactions as Transaction[];
    } catch (err) {
      console.warn("Failed to fetch transactions from indexer:", err);
      return [];
    }
  }
}
