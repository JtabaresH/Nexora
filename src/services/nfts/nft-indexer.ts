import { NFT, NFTStandard } from "@/types/nft";
import { getExplorerApiUrl } from "@/config/networks";
import {
  MetadataService,
  type RawNFTMetadata,
} from "../metadata/metadata-service";
import { BlockchainClient } from "../blockchain/viem-client";
import { erc721Abi } from "@/contracts/abis/erc721";
import { erc1155Abi } from "@/contracts/abis/erc1155";

/**
 * Alchemy NFT API response types
 */
interface AlchemyNFTResponse {
  ownedNfts: AlchemyOwnedNFT[];
  totalCount: number;
  pageKey?: string;
}

interface AlchemyOwnedNFT {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    tokenType: "ERC721" | "ERC1155" | string;
    openSeaMetadata?: {
      collectionName?: string;
      imageUrl?: string;
      description?: string;
    };
  };
  tokenId: string;
  tokenType: "ERC721" | "ERC1155" | string;
  name?: string;
  description?: string;
  tokenUri?: string;
  image?: {
    cachedUrl?: string;
    originalUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
  };
  raw?: {
    metadata?: Record<string, unknown>;
  };
  balance?: string;
}

/**
 * Blockscout token transfer response
 */
interface EtherscanTokenTransfer {
  contractAddress: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  from: string;
  to: string;
  tokenValue?: string;
}

interface ExplorerOwnedNFT {
  contractAddress: string;
  tokenId: string;
  standard: NFTStandard;
  fallbackName?: string;
  quantity?: bigint;
}

/**
 * Known NFT collections on World Chain that we can query directly via RPC.
 * Users can also import NFT contracts manually.
 */
export interface KnownNFTContract {
  address: string;
  standard: NFTStandard;
  name: string;
  supportsEnumeration?: boolean; // ERC-721 Enumerable
}

/**
 * NFT Indexer Service
 *
 * Multi-strategy NFT discovery:
 * 1. Alchemy NFT API (preferred - comprehensive, metadata included)
 * 2. Blockscout token transfer API (fallback - discovers NFTs by transfer events)
 * 3. Direct RPC for known/imported contracts (fallback - limited to known addresses)
 */
export class NFTIndexerService {
  private static readonly ALCHEMY_BASE_URLS: Record<number, string> = {
    480: "https://worldchain-mainnet.g.alchemy.com/nft/v3",
    4801: "https://worldchain-sepolia.g.alchemy.com/nft/v3",
  };

  /**
   * Primary NFT fetch strategy: Alchemy NFT API
   * Works on World Chain mainnet & testnet via Alchemy public endpoints
   */
  static async fetchFromAlchemy(
    ownerAddress: string,
    chainId: number
  ): Promise<NFT[]> {
    const baseUrl = this.ALCHEMY_BASE_URLS[chainId];
    if (!baseUrl) return [];

    try {
      // Use the public API key embedded in the Alchemy RPC URL
      // For production, use a dedicated API key via env var
      const apiKey = process.env.ALCHEMY_API_KEY || "demo";
      const url = `${baseUrl}/${apiKey}/getNFTsForOwner?owner=${ownerAddress}&withMetadata=true&pageSize=100`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 30 },
      });

      if (!res.ok) {
        console.warn(`Alchemy NFT API returned ${res.status}`);
        return [];
      }

      const data: AlchemyNFTResponse = await res.json();

      return data.ownedNfts.map((nft) => {
        const standard: NFTStandard =
          nft.tokenType === "ERC1155" ? "ERC1155" : "ERC721";
        const imageUrl =
          nft.image?.cachedUrl ||
          nft.image?.originalUrl ||
          nft.image?.thumbnailUrl ||
          nft.image?.pngUrl;
        const rawMetadata = nft.raw?.metadata as RawNFTMetadata | undefined;

        return MetadataService.normalizeNFT({
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          standard,
          chainId,
          rawMetadata: {
            ...rawMetadata,
            name: nft.name ?? rawMetadata?.name,
            description: nft.description ?? rawMetadata?.description,
            ...(imageUrl ? { image: imageUrl } : {}),
          },
          quantity: standard === "ERC1155" ? BigInt(nft.balance || "1") : BigInt(1),
          collectionName:
            nft.contract.openSeaMetadata?.collectionName || nft.contract.name,
          owner: ownerAddress,
          tokenUri: nft.tokenUri,
        });
      });
    } catch (err) {
      console.warn("Alchemy NFT fetch failed:", err);
      return [];
    }
  }

  /**
   * Fallback strategy: Blockscout token transfer API
   * Discovers ERC-721 and ERC-1155 tokens by scanning transfer events to the owner
   */
  static async fetchFromExplorer(
    ownerAddress: string,
    chainId: number
  ): Promise<NFT[]> {
    const apiUrl = getExplorerApiUrl(chainId);
    if (!apiUrl) return [];

    const fetchTransfers = async (
      action: "tokennfttx" | "token1155tx"
    ): Promise<EtherscanTokenTransfer[]> => {
      const url = `${apiUrl}?module=account&action=${action}&address=${ownerAddress}&startblock=0&endblock=99999999&sort=desc`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) return [];

        const data: { result?: unknown } = await response.json();
        return Array.isArray(data.result)
          ? (data.result as EtherscanTokenTransfer[])
          : [];
      } catch (err) {
        console.warn(`Blockscout ${action} fetch warning:`, err);
        return [];
      }
    };

    const [erc721Transfers, erc1155Transfers] = await Promise.all([
      fetchTransfers("tokennfttx"),
      fetchTransfers("token1155tx"),
    ]);
    const ownedItems: ExplorerOwnedNFT[] = [];
    const normalizedOwner = ownerAddress.toLowerCase();

    // Track ERC-721 ownership from transfer events.
    const ownershipMap = new Map<string, EtherscanTokenTransfer>();
    for (const tx of erc721Transfers) {
      const key = `${tx.contractAddress.toLowerCase()}-${tx.tokenID}`;
      if (tx.to.toLowerCase() === normalizedOwner) {
        ownershipMap.set(key, tx);
      } else if (tx.from.toLowerCase() === normalizedOwner) {
        ownershipMap.delete(key);
      }
    }
    for (const tx of ownershipMap.values()) {
      ownedItems.push({
        contractAddress: tx.contractAddress,
        tokenId: tx.tokenID,
        standard: "ERC721",
        fallbackName: tx.tokenName,
      });
    }

    // Track net ERC-1155 balances per token.
    const balanceMap = new Map<
      string,
      { contract: string; tokenId: string; name: string; balance: bigint }
    >();
    for (const tx of erc1155Transfers) {
      const key = `${tx.contractAddress.toLowerCase()}-${tx.tokenID}`;
      const existing = balanceMap.get(key) || {
        contract: tx.contractAddress,
        tokenId: tx.tokenID,
        name: tx.tokenName || "",
        balance: BigInt(0),
      };

      const amount = BigInt(tx.tokenValue || "1");
      if (tx.to.toLowerCase() === normalizedOwner) {
        existing.balance += amount;
      } else if (tx.from.toLowerCase() === normalizedOwner) {
        existing.balance -= amount;
      }

      balanceMap.set(key, existing);
    }
    for (const item of balanceMap.values()) {
      if (item.balance <= BigInt(0)) continue;
      ownedItems.push({
        contractAddress: item.contract,
        tokenId: item.tokenId,
        standard: "ERC1155",
        fallbackName: item.name,
        quantity: item.balance,
      });
    }

    const enriched = await Promise.all(
      ownedItems.slice(0, 50).map((item) =>
        this.enrichNFTFromRPC(
          item.contractAddress,
          item.tokenId,
          item.standard,
          chainId,
          ownerAddress,
          item.fallbackName,
          item.quantity
        )
      )
    );
    return enriched.filter((nft): nft is NFT => nft !== null);
  }

  /**
   * Enriches an NFT with on-chain metadata from the contract's tokenURI/uri
   */
  private static async enrichNFTFromRPC(
    contractAddress: string,
    tokenId: string,
    standard: NFTStandard,
    chainId: number,
    ownerAddress: string,
    fallbackName?: string,
    quantity?: bigint
  ): Promise<NFT | null> {
    try {
      let tokenUri: string | null = null;
      let collectionName: string | undefined = fallbackName || undefined;

      // Fetch tokenURI from on-chain
      if (standard === "ERC721") {
        tokenUri = await BlockchainClient.getErc721TokenUri(
          contractAddress,
          BigInt(tokenId),
          chainId
        );

        // Try to get collection name from contract
        try {
          const client = BlockchainClient.getClient(chainId);
          const name = await client.readContract({
            address: contractAddress as `0x${string}`,
            abi: erc721Abi,
            functionName: "name",
          });
          if (name) collectionName = name as string;
        } catch {
          // Collection name unavailable
        }
      } else {
        tokenUri = await BlockchainClient.getErc1155Uri(
          contractAddress,
          BigInt(tokenId),
          chainId
        );
        if (tokenUri) {
          tokenUri = MetadataService.expandErc1155Uri(tokenUri, tokenId);
        }
      }

      // Fetch remote metadata JSON
      let rawMetadata = null;
      if (tokenUri) {
        rawMetadata = await MetadataService.fetchMetadata(tokenUri);
      }

      return MetadataService.normalizeNFT({
        contractAddress,
        tokenId,
        standard,
        chainId,
        rawMetadata,
        quantity: quantity || (standard === "ERC1155" ? BigInt(1) : BigInt(1)),
        collectionName,
        owner: ownerAddress,
        tokenUri: tokenUri || undefined,
      });
    } catch (err) {
      console.warn(`Failed to enrich NFT ${contractAddress}#${tokenId}:`, err);
      // Return a basic NFT entry even without metadata
      return MetadataService.normalizeNFT({
        contractAddress,
        tokenId,
        standard,
        chainId,
        rawMetadata: { name: fallbackName || `Token #${tokenId}` },
        quantity: quantity || BigInt(1),
        collectionName: fallbackName,
        owner: ownerAddress,
      });
    }
  }

  /**
   * Direct RPC query for known ERC-1155 token balance
   */
  static async getErc1155Balance(
    contractAddress: string,
    ownerAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<bigint> {
    try {
      const client = BlockchainClient.getClient(chainId);
      const balance = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: "balanceOf",
        args: [ownerAddress as `0x${string}`, BigInt(tokenId)],
      });
      return balance as bigint;
    } catch {
      return BigInt(0);
    }
  }

  /**
   * Verify ERC-721 ownership via RPC ownerOf
   */
  static async verifyErc721Ownership(
    contractAddress: string,
    tokenId: string,
    expectedOwner: string,
    chainId: number
  ): Promise<boolean> {
    try {
      const client = BlockchainClient.getClient(chainId);
      const owner = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });
      return (owner as string).toLowerCase() === expectedOwner.toLowerCase();
    } catch {
      return false;
    }
  }
}
