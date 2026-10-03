export type NFTStandard = "ERC721" | "ERC1155";

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  contractAddress: string;
  tokenId: string;
  standard: NFTStandard;
  name?: string;
  description?: string;
  imageUrl?: string;
  quantity?: bigint; // For ERC-1155; defaults to 1n for ERC-721
  collectionName?: string;
  collectionDescription?: string;
  collectionImageUrl?: string;
  owner?: string;
  tokenUri?: string;
  metadataUri?: string;
  chainId: number;
  metadata?: Record<string, unknown>;
  attributes?: NFTAttribute[];
}

export interface NFTCollectionGroup {
  id: string; // usually contractAddress or collection slug
  name: string;
  contractAddress: string;
  standard: NFTStandard;
  iconUrl?: string;
  description?: string;
  items: NFT[];
}
