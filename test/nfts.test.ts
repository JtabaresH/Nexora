import { describe, it, expect } from "vitest";
import { MetadataService } from "../src/services/metadata/metadata-service";
import { groupNFTsByCollection } from "../src/services/assets/types";
import type { NFT } from "../src/types/nft";

describe("NFT Indexer & Display", () => {
  it("normalizes ERC-721 NFT from raw metadata", () => {
    const nft = MetadataService.normalizeNFT({
      contractAddress: "0x1234567890123456789012345678901234567890",
      tokenId: "42",
      standard: "ERC721",
      chainId: 480,
      rawMetadata: {
        name: "World Explorer #42",
        description: "A genesis explorer badge",
        image: "ipfs://QmTestHash/42.png",
        attributes: [
          { trait_type: "Class", value: "Explorer" },
          { trait_type: "Level", value: 5 },
        ],
      },
      owner: "0xOwnerAddress",
      collectionName: "World Explorers",
    });

    expect(nft.name).toBe("World Explorer #42");
    expect(nft.standard).toBe("ERC721");
    expect(nft.imageUrl).toContain("ipfs.io/ipfs/QmTestHash/42.png");
    expect(nft.attributes).toHaveLength(2);
    expect(nft.attributes![0].trait_type).toBe("Class");
    expect(nft.collectionName).toBe("World Explorers");
    expect(nft.quantity).toBe(BigInt(1));
  });

  it("normalizes ERC-1155 NFT with quantity", () => {
    const nft = MetadataService.normalizeNFT({
      contractAddress: "0xABCDEF1234567890123456789012345678901234",
      tokenId: "7",
      standard: "ERC1155",
      chainId: 480,
      rawMetadata: {
        name: "Energy Shard",
        description: "Multi-edition utility token",
        image_url: "https://example.com/shard.png",
      },
      quantity: BigInt(10),
      owner: "0xOwnerAddress",
    });

    expect(nft.standard).toBe("ERC1155");
    expect(nft.quantity).toBe(BigInt(10));
    expect(nft.imageUrl).toBe("https://example.com/shard.png");
    expect(nft.name).toBe("Energy Shard");
  });

  it("generates fallback image when metadata has no image", () => {
    const nft = MetadataService.normalizeNFT({
      contractAddress: "0x0000000000000000000000000000000000000001",
      tokenId: "1",
      standard: "ERC721",
      chainId: 480,
      rawMetadata: {
        name: "Imageless NFT",
      },
    });

    expect(nft.imageUrl).toContain("data:image/svg+xml");
    expect(nft.imageUrl).toContain("Imageless%20NFT");
  });

  it("groups NFTs by collection correctly", () => {
    const nfts: NFT[] = [
      {
        contractAddress: "0xAAA",
        tokenId: "1",
        standard: "ERC721",
        chainId: 480,
        name: "Cyber #1",
        collectionName: "CyberWorld",
      },
      {
        contractAddress: "0xAAA",
        tokenId: "2",
        standard: "ERC721",
        chainId: 480,
        name: "Cyber #2",
        collectionName: "CyberWorld",
      },
      {
        contractAddress: "0xBBB",
        tokenId: "10",
        standard: "ERC1155",
        chainId: 480,
        name: "Shard #10",
        quantity: BigInt(5),
        collectionName: "Artifacts",
      },
    ];

    const groups = groupNFTsByCollection(nfts);

    expect(groups).toHaveLength(2);

    const cyberGroup = groups.find((g) => g.name === "CyberWorld");
    expect(cyberGroup).toBeDefined();
    expect(cyberGroup!.items).toHaveLength(2);
    expect(cyberGroup!.standard).toBe("ERC721");

    const artifactGroup = groups.find((g) => g.name === "Artifacts");
    expect(artifactGroup).toBeDefined();
    expect(artifactGroup!.items).toHaveLength(1);
    expect(artifactGroup!.standard).toBe("ERC1155");
  });

  it("handles mixed ERC-721 and ERC-1155 in different collections", () => {
    const nfts: NFT[] = [
      {
        contractAddress: "0xAAA",
        tokenId: "1",
        standard: "ERC721",
        chainId: 480,
        collectionName: "Col A",
      },
      {
        contractAddress: "0xBBB",
        tokenId: "100",
        standard: "ERC1155",
        chainId: 480,
        quantity: BigInt(3),
        collectionName: "Col B",
      },
      {
        contractAddress: "0xBBB",
        tokenId: "200",
        standard: "ERC1155",
        chainId: 480,
        quantity: BigInt(7),
        collectionName: "Col B",
      },
    ];

    const groups = groupNFTsByCollection(nfts);
    expect(groups).toHaveLength(2);

    const colB = groups.find((g) => g.name === "Col B");
    expect(colB!.items).toHaveLength(2);
    expect(colB!.standard).toBe("ERC1155");
  });

  it("resolves various URI formats correctly", () => {
    expect(MetadataService.resolveUri("ipfs://QmABCDEF")).toBe(
      "https://ipfs.io/ipfs/QmABCDEF"
    );
    expect(MetadataService.resolveUri("ar://arweaveHash123")).toBe(
      "https://arweave.net/arweaveHash123"
    );
    expect(MetadataService.resolveUri("https://example.com/nft.json")).toBe(
      "https://example.com/nft.json"
    );
    expect(MetadataService.resolveUri("javascript:alert(1)")).toBe("");
    expect(MetadataService.resolveUri(null)).toBe("");
    expect(MetadataService.resolveUri(undefined)).toBe("");
  });
});
