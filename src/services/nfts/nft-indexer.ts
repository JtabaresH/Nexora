import { NFT, NFTStandard } from "@/types/nft";
import { MetadataService } from "../metadata/metadata-service";
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
 * Worldscan/Etherscan ERC-721 transfer event
 */
interface EtherscanTokenTransfer {
  contractAddress: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  from: string;
  to: string;
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
 * 2. Worldscan/Etherscan token transfer API (fallback - discovers NFTs by transfer events)
 * 3. Direct RPC for known/imported contracts (fallback - limited to known addresses)
 */
export class NFTIndexerService {
  private static readonly ALCHEMY_BASE_URLS: Record<number, string> = {
    480: "https://worldchain-mainnet.g.alchemy.com/nft/v3",
    4801: "https://worldchain-sepolia.g.alchemy.com/nft/v3",
  };

  private static readonly WORLDSCAN_API_URLS: Record<number, string> = {
    480: "https://api.worldscan.org/api",
    4801: "https://api-sepolia.worldscan.org/api",
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

        return MetadataService.normalizeNFT({
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          standard,
          chainId,
          rawMetadata: nft.raw?.metadata
            ? {
                name: nft.name,
                description: nft.description,
                image: imageUrl,
                ...(nft.raw.metadata as Record<string, unknown>),
              }
            : {
                name: nft.name,
                description: nft.description,
                image: imageUrl,
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
   * Fallback strategy: Worldscan/Etherscan token transfer API
   * Discovers ERC-721 and ERC-1155 tokens by scanning transfer events to the owner
   */
  static async fetchFromWorldscan(
    ownerAddress: string,
    chainId: number
  ): Promise<NFT[]> {
    const apiUrl = this.WORLDSCAN_API_URLS[chainId];
    if (!apiUrl) return [];

    const discoveredNFTs: NFT[] = [];

    try {
      // 1. Fetch ERC-721 transfers TO the owner
      const erc721Url = `${apiUrl}?module=account&action=tokennfttx&address=${ownerAddress}&startblock=0&endblock=99999999&sort=desc`;
      const erc721Res = await fetch(erc721Url, {
        signal: AbortSignal.timeout(6000),
      });

      if (erc721Res.ok) {
        const erc721Data = await erc721Res.json();
        if (erc721Data.status === "1" && Array.isArray(erc721Data.result)) {
          // Track ownership: NFTs received minus NFTs sent
          const ownershipMap = new Map<string, EtherscanTokenTransfer>();

          for (const tx of erc721Data.result as EtherscanTokenTransfer[]) {
            const key = `${tx.contractAddress.toLowerCase()}-${tx.tokenID}`;
            if (tx.to.toLowerCase() === ownerAddress.toLowerCase()) {
              ownershipMap.set(key, tx);
            } else if (tx.from.toLowerCase() === ownerAddress.toLowerCase()) {
              ownershipMap.delete(key);
            }
          }

          // For each owned token, fetch metadata
          for (const [, tx] of ownershipMap) {
            const nft = await this.enrichNFTFromRPC(
              tx.contractAddress,
              tx.tokenID,
              "ERC721",
              chainId,
              ownerAddress,
              tx.tokenName
            );
            if (nft) discoveredNFTs.push(nft);
          }
        }
      }
    } catch (err) {
      console.warn("Worldscan ERC-721 fetch warning:", err);
    }

    try {
      // 2. Fetch ERC-1155 transfers TO the owner
      const erc1155Url = `${this.WORLDSCAN_API_URLS[chainId]}?module=account&action=token1155tx&address=${ownerAddress}&startblock=0&endblock=99999999&sort=desc`;
      const erc1155Res = await fetch(erc1155Url, {
        signal: AbortSignal.timeout(6000),
      });

      if (erc1155Res.ok) {
        const erc1155Data = await erc1155Res.json();
        if (erc1155Data.status === "1" && Array.isArray(erc1155Data.result)) {
          // Track net balance per token
          const balanceMap = new Map<
            string,
            { contract: string; tokenId: string; name: string; balance: bigint }
          >();

          for (const tx of erc1155Data.result) {
            const key = `${tx.contractAddress.toLowerCase()}-${tx.tokenID}`;
            const existing = balanceMap.get(key) || {
              contract: tx.contractAddress,
              tokenId: tx.tokenID,
              name: tx.tokenName || "",
              balance: BigInt(0),
            };

            const amount = BigInt(tx.tokenValue || "1");
            if (tx.to.toLowerCase() === ownerAddress.toLowerCase()) {
              existing.balance += amount;
            } else if (tx.from.toLowerCase() === ownerAddress.toLowerCase()) {
              existing.balance -= amount;
            }

            balanceMap.set(key, existing);
          }

          // Filter to tokens still owned (positive balance)
          for (const [, item] of balanceMap) {
            if (item.balance <= BigInt(0)) continue;

            const nft = await this.enrichNFTFromRPC(
              item.contract,
              item.tokenId,
              "ERC1155",
              chainId,
              ownerAddress,
              item.name,
              item.balance
            );
            if (nft) discoveredNFTs.push(nft);
          }
        }
      }
    } catch (err) {
      console.warn("Worldscan ERC-1155 fetch warning:", err);
    }

    return discoveredNFTs;
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
