import { afterEach, describe, expect, it, vi } from "vitest";
import { NFTIndexerService } from "../src/services/nfts/nft-indexer";

const contractAddress = "0xcf769aef00a5d2ac7e2bd4116e2728c39f62fed3";

function alchemyResponse(image?: { cachedUrl?: string }) {
  return {
    ownedNfts: [
      {
        contract: {
          address: contractAddress,
          tokenType: "ERC721",
          name: "Test Collection",
        },
        tokenId: "1",
        tokenType: "ERC721",
        name: "Alchemy NFT",
        description: "Alchemy description",
        image,
        raw: {
          metadata: {
            name: "Raw NFT",
            description: "Raw description",
            image: "ipfs://QmRawMetadataImage/image.png",
          },
        },
      },
    ],
    totalCount: 1,
  };
}

describe("NFTIndexerService.fetchFromAlchemy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers the cached Alchemy image over the raw metadata image", async () => {
    const cachedUrl =
      "https://nft2-cdn.alchemy.com/world-mainnet/abcd/image.png";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => alchemyResponse({ cachedUrl }),
      })
    );

    const [nft] = await NFTIndexerService.fetchFromAlchemy(
      "0xd79eE927385f9cc973E95525cAFF6ba056269474",
      480
    );

    expect(nft.imageUrl).toBe(cachedUrl);
  });

  it("retains the raw metadata image when Alchemy has no image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => alchemyResponse(),
      })
    );

    const [nft] = await NFTIndexerService.fetchFromAlchemy(
      "0xd79eE927385f9cc973E95525cAFF6ba056269474",
      480
    );

    expect(nft.imageUrl).toBe(
      "https://ipfs.io/ipfs/QmRawMetadataImage/image.png"
    );
  });
});
