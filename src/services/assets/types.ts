import { Token } from "@/types/token";
import { NFT, NFTCollectionGroup } from "@/types/nft";
import { Transaction } from "@/types/transaction";

export interface AssetProvider {
  getTokens(address: string, chainId: number): Promise<Token[]>;
  getNFTs(address: string, chainId: number): Promise<NFT[]>;
  getTransactions(address: string, chainId: number): Promise<Transaction[]>;
}

/**
 * Helper to group an array of NFTs by Collection
 */
export function groupNFTsByCollection(nfts: NFT[]): NFTCollectionGroup[] {
  const map = new Map<string, NFTCollectionGroup>();

  for (const nft of nfts) {
    const key = nft.collectionName || nft.contractAddress;
    const existing = map.get(key);

    if (existing) {
      existing.items.push(nft);
    } else {
      map.set(key, {
        id: key,
        name: nft.collectionName || "World Chain Collectibles",
        contractAddress: nft.contractAddress,
        standard: nft.standard,
        iconUrl: nft.collectionImageUrl || nft.imageUrl,
        description: nft.collectionDescription,
        items: [nft],
      });
    }
  }

  return Array.from(map.values());
}
