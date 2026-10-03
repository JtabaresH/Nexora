import { describe, it, expect } from "vitest";
import { MockAssetProvider } from "../src/services/assets/mock-asset-provider";
import { groupNFTsByCollection } from "../src/services/assets/types";
import { PricingService } from "../src/services/pricing/pricing-service";

describe("Assets and Collection Grouping", () => {
  const provider = new MockAssetProvider();
  const testAddress = "0x71C8b381034872910485720194857291048592FC";

  it("should provide mock tokens including WLD and tokens with unavailable prices", async () => {
    const tokens = await provider.getTokens(testAddress, 480);
    expect(tokens.length).toBeGreaterThanOrEqual(3);

    const wld = tokens.find((t) => t.symbol === "WLD");
    expect(wld).toBeDefined();
    expect(wld?.usdPrice).toBeGreaterThan(0);

    const xyz = tokens.find((t) => t.symbol === "XYZ");
    expect(xyz).toBeDefined();
    // Verify that price is deliberately undefined as per requirement
    expect(xyz?.usdPrice).toBeUndefined();

    // Verify calculateUsdValue returns null for unavailable price
    const value = PricingService.calculateUsdValue(xyz!.balance, xyz!.decimals, xyz?.usdPrice);
    expect(value).toBeNull();
  });

  it("should group NFTs by Collection properly", async () => {
    const nfts = await provider.getNFTs(testAddress, 480);
    expect(nfts.length).toBeGreaterThan(0);

    const collections = groupNFTsByCollection(nfts);
    expect(collections.length).toBeGreaterThan(1);

    // Verify Cyber World collection
    const cyberWorldCol = collections.find((c) => c.name === "Cyber World");
    expect(cyberWorldCol).toBeDefined();
    expect(cyberWorldCol?.items.length).toBe(2);

    // Verify Orb Artifacts collection
    const orbCol = collections.find((c) => c.name === "Orb Artifacts");
    expect(orbCol).toBeDefined();
    expect(orbCol?.items.length).toBe(2);

    // Check ERC-1155 quantity handling
    const sword = orbCol?.items.find((i) => i.name === "Cyber Sword");
    expect(sword?.standard).toBe("ERC1155");
    expect(sword?.quantity).toBe(BigInt(4));
  });

  it("should format token amounts with correct decimal precision", () => {
    const amount = BigInt("245300000000000000000"); // 245.3 WLD with 18 decimals
    const formatted = PricingService.formatTokenAmount(amount, 18);
    expect(formatted).toBe("245.3");
  });

  it("should compute USD valuations accurately", () => {
    const amount = BigInt("100000000"); // 100 USDC with 6 decimals
    const usd = PricingService.calculateUsdValue(amount, 6, 1.0);
    expect(usd).toBe("$100.00");
  });

  it("should format unit prices with dynamic precision", () => {
    expect(PricingService.formatPrice(2680.5)).toBe("$2,680.50");
    expect(PricingService.formatPrice(0.6134)).toBe("$0.6134");
    expect(PricingService.formatPrice(0)).toBe("$0.00");
  });

  it("should provide price info for major assets", () => {
    const wldPrice = PricingService.getPrice("WLD");
    expect(wldPrice).toBeDefined();
    expect(wldPrice?.usdPrice).toBeGreaterThan(0);

    const ethPrice = PricingService.getPrice("ETH");
    expect(ethPrice).toBeDefined();
    expect(ethPrice?.usdPrice).toBeGreaterThan(1000);
  });
});
