import { BlockchainClient } from "../blockchain/viem-client";
import { getExplorerApiUrl, getNetworkConfig } from "@/config/networks";

export interface DiscoveredToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  logoUrl?: string;
  chainId: number;
}

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string | null;
}

/**
 * Discovers every ERC-20 the wallet currently holds, including tokens
 * created inside World App, using Alchemy balances + explorer transfers.
 */
export class TokenIndexerService {
  static async fetchHeldTokens(
    ownerAddress: string,
    chainId: number
  ): Promise<DiscoveredToken[]> {
    if (!BlockchainClient.isValidAddress(ownerAddress)) return [];

    const fromAlchemy = await this.fetchFromAlchemy(ownerAddress, chainId);
    if (fromAlchemy.length > 0) return fromAlchemy;

    return this.fetchFromExplorer(ownerAddress, chainId);
  }

  private static async fetchFromAlchemy(
    ownerAddress: string,
    chainId: number
  ): Promise<DiscoveredToken[]> {
    try {
      const rpcUrl = getNetworkConfig(chainId).rpcUrls.default;
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenBalances",
          params: [ownerAddress, "erc20"],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return [];

      const payload = await res.json();
      const balances: AlchemyTokenBalance[] = payload?.result?.tokenBalances || [];
      if (!Array.isArray(balances) || balances.length === 0) return [];

      const held = balances.filter((item) => {
        if (!item?.contractAddress || item.error) return false;
        try {
          return BigInt(item.tokenBalance || "0") > BigInt(0);
        } catch {
          return false;
        }
      });

      const discovered = await Promise.all(
        held.slice(0, 80).map(async (item): Promise<DiscoveredToken | null> => {
          const metadata = await BlockchainClient.getErc20Metadata(
            item.contractAddress,
            chainId
          );
          if (!metadata) return null;

          return {
            address: item.contractAddress,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            balance: BigInt(item.tokenBalance).toString(),
            logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.symbol}`,
            chainId,
          } satisfies DiscoveredToken;
        })
      );

      return discovered.filter((token): token is DiscoveredToken => token !== null);
    } catch (err) {
      console.warn("Alchemy token balance fetch failed:", err);
      return [];
    }
  }

  private static async fetchFromExplorer(
    ownerAddress: string,
    chainId: number
  ): Promise<DiscoveredToken[]> {
    const apiUrl = getExplorerApiUrl(chainId);
    if (!apiUrl) return [];

    try {
      const url = `${apiUrl}?module=account&action=tokentx&address=${ownerAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.result)) return [];

      const unique = new Map<
        string,
        { address: string; name: string; symbol: string; decimals: number }
      >();

      for (const tx of data.result) {
        const address = String(tx.contractAddress || "").toLowerCase();
        if (!BlockchainClient.isValidAddress(address) || unique.has(address)) continue;
        unique.set(address, {
          address: tx.contractAddress,
          name: tx.tokenName || "Unknown Token",
          symbol: tx.tokenSymbol || "TOKEN",
          decimals: parseInt(tx.tokenDecimal, 10) || 18,
        });
      }

      const discovered = await Promise.all(
        Array.from(unique.values())
          .slice(0, 80)
          .map(async (info): Promise<DiscoveredToken | null> => {
            const balance = await BlockchainClient.getErc20Balance(
              info.address,
              ownerAddress,
              chainId
            );
            if (balance <= BigInt(0)) return null;

            return {
              address: info.address,
              name: info.name,
              symbol: info.symbol,
              decimals: info.decimals,
              balance: balance.toString(),
              logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${info.symbol}`,
              chainId,
            } satisfies DiscoveredToken;
          })
      );

      return discovered.filter((token): token is DiscoveredToken => token !== null);
    } catch (err) {
      console.warn("Explorer token discovery failed:", err);
      return [];
    }
  }
}
