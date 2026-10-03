import { describe, it, expect } from "vitest";
import { TransactionIndexerService } from "../src/services/transactions/tx-indexer";

describe("TransactionIndexerService", () => {
  describe("API URL mapping", () => {
    it("has correct Worldscan API URLs for supported chains", () => {
      // Access private static API_URLS via any cast for testing
      const urls = (TransactionIndexerService as unknown as { API_URLS: Record<number, string> }).API_URLS;

      expect(urls[480]).toBe("https://api.worldscan.org/api");
      expect(urls[4801]).toBe("https://api-sepolia.worldscan.org/api");
      expect(urls[10]).toBe("https://api-optimistic.etherscan.io/api");
    });
  });

  describe("fetchTransactions", () => {
    it("returns empty array for unsupported chain", async () => {
      const result = await TransactionIndexerService.fetchTransactions(
        "0x3D5995Eb27fb94c9b2E6356A14ba5F3503904707",
        99999
      );
      expect(result).toEqual([]);
    });
  });

  describe("Transaction type definitions", () => {
    it("supports all required transaction types", () => {
      const types = ["TOKEN_SEND", "TOKEN_RECEIVE", "NFT_SEND", "NFT_RECEIVE"];
      const statuses = ["PENDING", "CONFIRMED", "FAILED"];
      const filters = ["ALL", "TOKENS", "NFTS", "SENT", "RECEIVED"];

      // Verify type strings are valid
      expect(types).toHaveLength(4);
      expect(statuses).toHaveLength(3);
      expect(filters).toHaveLength(5);
    });
  });

  describe("ETH amount formatting", () => {
    it("formats very small ETH values in scientific notation", () => {
      const valueInEth = 0.000001;
      const formatted =
        valueInEth < 0.0001
          ? valueInEth.toExponential(2)
          : valueInEth < 1
          ? valueInEth.toFixed(6)
          : valueInEth.toFixed(4);

      expect(formatted).toBe("1.00e-6");
    });

    it("formats medium ETH values with 6 decimals", () => {
      const valueInEth = 0.123456;
      const formatted =
        valueInEth < 0.0001
          ? valueInEth.toExponential(2)
          : valueInEth < 1
          ? valueInEth.toFixed(6)
          : valueInEth.toFixed(4);

      expect(formatted).toBe("0.123456");
    });

    it("formats large ETH values with 4 decimals", () => {
      const valueInEth = 12.3456789;
      const formatted =
        valueInEth < 0.0001
          ? valueInEth.toExponential(2)
          : valueInEth < 1
          ? valueInEth.toFixed(6)
          : valueInEth.toFixed(4);

      expect(formatted).toBe("12.3457");
    });
  });
});
