import { describe, it, expect } from "vitest";
import { MetadataService } from "../src/services/metadata/metadata-service";

describe("MetadataService", () => {
  it("should resolve IPFS URIs into public gateway HTTPS URLs", () => {
    const ipfsUri = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    const resolved = MetadataService.resolveUri(ipfsUri);
    expect(resolved.startsWith("https://ipfs.io/ipfs/")).toBe(true);
    expect(resolved).toContain("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
  });

  it("should resolve Arweave URIs into public gateway HTTPS URLs", () => {
    const arUri = "ar://tZq_6oFfTj18_m40u9sK3";
    const resolved = MetadataService.resolveUri(arUri);
    expect(resolved).toBe("https://arweave.net/tZq_6oFfTj18_m40u9sK3");
  });

  it("resolves IPFS URIs without duplicating the ipfs path", () => {
    expect(MetadataService.resolveUri("ipfs://QmHash/metadata.json")).toBe(
      "https://ipfs.io/ipfs/QmHash/metadata.json"
    );
    expect(MetadataService.resolveUri("ipfs://ipfs/QmHash/metadata.json")).toBe(
      "https://ipfs.io/ipfs/QmHash/metadata.json"
    );
  });

  it("preserves existing HTTP IPFS gateway URLs", () => {
    const pinataUrl = "https://gateway.pinata.cloud/ipfs/QmHash/image.png";
    expect(MetadataService.resolveUri(pinataUrl)).toBe(pinataUrl);
  });

  it("expands ERC-1155 token IDs to lowercase 64-character hex", () => {
    const expanded = MetadataService.expandErc1155Uri(
      "https://example.com/{id}/{id}.json",
      "2"
    );
    const paddedTwo = `${"0".repeat(63)}2`;
    expect(expanded).toBe(
      `https://example.com/${paddedTwo}/${paddedTwo}.json`
    );

    expect(
      MetadataService.expandErc1155Uri(
        "https://example.com/{id}.json",
        "340282366920938463463374607431768211455"
      )
    ).toBe(`https://example.com/${"0".repeat(32)}${"f".repeat(32)}.json`);

    const uriWithoutPlaceholder = "https://example.com/metadata.json";
    expect(
      MetadataService.expandErc1155Uri(uriWithoutPlaceholder, "2")
    ).toBe(uriWithoutPlaceholder);
  });

  it("returns ordered, deduplicated IPFS image gateway candidates", () => {
    expect(
      MetadataService.getImageCandidates("ipfs://QmHash/images/nft.png")
    ).toEqual([
      "https://ipfs.io/ipfs/QmHash/images/nft.png",
      "https://gateway.pinata.cloud/ipfs/QmHash/images/nft.png",
      "https://dweb.link/ipfs/QmHash/images/nft.png",
    ]);
    expect(
      MetadataService.getImageCandidates("https://example.com/nft.png")
    ).toEqual(["https://example.com/nft.png"]);
    expect(MetadataService.getImageCandidates(undefined)).toEqual([]);
  });

  it("should preserve valid HTTPS URLs", () => {
    const httpsUri = "https://images.unsplash.com/photo-123";
    expect(MetadataService.resolveUri(httpsUri)).toBe(httpsUri);
  });

  it("should reject malicious scripts or dangerous URI schemes", () => {
    expect(MetadataService.resolveUri("javascript:alert(1)")).toBe("");
    expect(MetadataService.resolveUri("vbscript:msgbox(1)")).toBe("");
  });

  it("should generate a fallback SVG image with custom seed", () => {
    const fallback = MetadataService.getFallbackImage("42", "Test Token");
    expect(fallback.startsWith("data:image/svg+xml")).toBe(true);
    expect(fallback).toContain("%2342");
  });

  it("should normalize raw metadata without crashing on missing properties", () => {
    const normalized = MetadataService.normalizeNFT({
      contractAddress: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
      tokenId: "99",
      standard: "ERC721",
      chainId: 480,
      rawMetadata: {
        name: "World Passport #99",
        attributes: [
          { trait_type: "Level", value: "Verified" },
          { trait_type: "Orb", value: 12 },
        ],
      },
    });

    expect(normalized.name).toBe("World Passport #99");
    expect(normalized.attributes?.length).toBe(2);
    expect(normalized.imageUrl).toBeDefined();
  });
});
