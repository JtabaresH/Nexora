import {
  createPublicClient,
  http,
  isAddress,
  PublicClient,
  formatUnits,
  parseUnits,
} from "viem";
import { getNetworkConfig } from "@/config/networks";
import { erc20Abi } from "@/contracts/abis/erc20";
import { erc721Abi } from "@/contracts/abis/erc721";
import { erc1155Abi } from "@/contracts/abis/erc1155";

export class BlockchainClient {
  private static clients: Map<number, PublicClient> = new Map();

  /**
   * Retrieves or creates a cached Viem PublicClient for the requested network
   */
  static getClient(chainId: number): PublicClient {
    const cached = this.clients.get(chainId);
    if (cached) return cached;

    const config = getNetworkConfig(chainId);
    const client = createPublicClient({
      transport: http(config.rpcUrls.default),
    });

    this.clients.set(chainId, client);
    return client;
  }

  /**
   * Validates if a string is a valid EVM address
   */
  static isValidAddress(address: string | undefined | null): boolean {
    if (!address) return false;
    return isAddress(address.trim());
  }

  /**
   * Truncates an EVM address for clean UI display (e.g. 0x1234...ABCD)
   */
  static truncateAddress(address: string | undefined | null, prefixLen = 6, suffixLen = 4): string {
    if (!address) return "";
    const clean = address.trim();
    if (clean.length <= prefixLen + suffixLen) return clean;
    return `${clean.slice(0, prefixLen)}...${clean.slice(-suffixLen)}`;
  }

  /**
   * Fetches native ETH balance
   */
  static async getNativeBalance(address: string, chainId: number): Promise<bigint> {
    if (!this.isValidAddress(address)) return BigInt(0);
    try {
      const client = this.getClient(chainId);
      return await client.getBalance({ address: address as `0x${string}` });
    } catch (err) {
      console.warn(`Failed to fetch native balance for ${address} on chain ${chainId}:`, err);
      return BigInt(0);
    }
  }

  /**
   * Fetches ERC-20 token balance
   */
  static async getErc20Balance(
    tokenAddress: string,
    ownerAddress: string,
    chainId: number
  ): Promise<bigint> {
    if (!this.isValidAddress(tokenAddress) || !this.isValidAddress(ownerAddress)) return BigInt(0);
    try {
      const client = this.getClient(chainId);
      const balance = await client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [ownerAddress as `0x${string}`],
      });
      return balance as bigint;
    } catch (err) {
      console.warn(`Failed to fetch ERC20 balance:`, err);
      return BigInt(0);
    }
  }

  /**
   * Reads ERC-20 contract metadata (name, symbol, decimals) directly from the blockchain
   */
  static async getErc20Metadata(
    tokenAddress: string,
    chainId: number
  ): Promise<{ name: string; symbol: string; decimals: number } | null> {
    if (!this.isValidAddress(tokenAddress)) return null;
    try {
      const client = this.getClient(chainId);
      const [name, symbol, decimals] = await Promise.all([
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "name",
        }) as Promise<string>,
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "symbol",
        }) as Promise<string>,
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        }) as Promise<number>,
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
      };
    } catch (err) {
      console.warn(`Failed to read ERC-20 metadata for ${tokenAddress}:`, err);
      return null;
    }
  }

  /**
   * Fetches ERC-721 token URI
   */
  static async getErc721TokenUri(
    contractAddress: string,
    tokenId: bigint,
    chainId: number
  ): Promise<string | null> {
    try {
      const client = this.getClient(chainId);
      const uri = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: "tokenURI",
        args: [tokenId],
      });
      return uri as string;
    } catch {
      return null;
    }
  }

  /**
   * Fetches ERC-1155 token URI
   */
  static async getErc1155Uri(
    contractAddress: string,
    tokenId: bigint,
    chainId: number
  ): Promise<string | null> {
    try {
      const client = this.getClient(chainId);
      const uri = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: "uri",
        args: [tokenId],
      });
      return uri as string;
    } catch {
      return null;
    }
  }

  /**
   * Safe parser from user input string to BigInt with decimals
   */
  static parseTokenAmount(amountStr: string, decimals: number): bigint {
    const clean = amountStr.trim().replace(/,/g, ".");
    if (!clean || isNaN(Number(clean)) || Number(clean) <= 0) {
      return BigInt(0);
    }
    return parseUnits(clean, decimals);
  }

  /**
   * Format BigInt to string with decimals
   */
  static formatUnits(amount: bigint, decimals: number): string {
    return formatUnits(amount, decimals);
  }
}
