import { describe, it, expect } from "vitest";
import { addressSchema, tokenTransferSchema, nftTransferSchema } from "../src/utils/validation";
import { BlockchainClient } from "../src/services/blockchain/viem-client";

describe("Address & Input Validation", () => {
  it("should validate correct EVM/World Chain addresses", () => {
    const validAddresses = [
      "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
      "0x71C8b381034872910485720194857291048592FC",
      "0x0000000000000000000000000000000000000000",
      "0x1234567890123456789012345678901234567890",
    ];

    for (const addr of validAddresses) {
      expect(BlockchainClient.isValidAddress(addr)).toBe(true);
      const res = addressSchema.safeParse(addr);
      expect(res.success).toBe(true);
    }
  });

  it("should reject invalid addresses", () => {
    const invalidAddresses = [
      "",
      "0x123",
      "not-an-address",
      "0xZZZZ85d8E48F8EAB294be644d9E25C3030863003",
      "0x2cFc85d8E48F8EAB294be644d9E25C3030863003extra",
    ];

    for (const addr of invalidAddresses) {
      expect(BlockchainClient.isValidAddress(addr)).toBe(false);
      const res = addressSchema.safeParse(addr);
      expect(res.success).toBe(false);
    }
  });

  it("should validate token transfer amounts", () => {
    const valid = tokenTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      amount: "25.5",
    });
    expect(valid.success).toBe(true);

    const zero = tokenTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      amount: "0",
    });
    expect(zero.success).toBe(false);

    const negative = tokenTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      amount: "-10",
    });
    expect(negative.success).toBe(false);

    const text = tokenTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      amount: "abc",
    });
    expect(text.success).toBe(false);
  });

  it("should validate NFT transfer quantities", () => {
    const valid = nftTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      quantity: 2,
    });
    expect(valid.success).toBe(true);

    const fraction = nftTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      quantity: 1.5,
    });
    expect(fraction.success).toBe(false);

    const zero = nftTransferSchema.safeParse({
      recipient: "0x71C8b381034872910485720194857291048592FC",
      quantity: 0,
    });
    expect(zero.success).toBe(false);
  });
});
