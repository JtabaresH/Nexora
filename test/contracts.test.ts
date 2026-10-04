import { describe, it, expect } from "vitest";
import { ContractEncoder } from "../src/contracts/encoder";

describe("Smart Contract Calldata Encoder", () => {
  const recipient = "0x71C8b381034872910485720194857291048592FC";
  const sender = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";

  it("should encode ERC-20 transfer calldata with selector 0xa9059cbb", () => {
    const amount = BigInt("1000000000000000000"); // 1 token
    const calldata = ContractEncoder.encodeErc20Transfer(recipient, amount);

    expect(calldata.startsWith("0xa9059cbb")).toBe(true);
    expect(calldata.length).toBe(10 + 64 * 2); // 4 bytes selector + 2 words
  });

  it("should encode ERC-721 safeTransferFrom calldata with selector 0x42842e0e", () => {
    const tokenId = BigInt(381);
    const calldata = ContractEncoder.encodeErc721Transfer(sender, recipient, tokenId);

    expect(calldata.startsWith("0x42842e0e")).toBe(true);
    expect(calldata.length).toBe(10 + 64 * 3); // 4 bytes selector + 3 words
  });

  it("should encode ERC-1155 safeTransferFrom calldata with selector 0xf242432a", () => {
    const id = BigInt(12);
    const amount = BigInt(2);
    const calldata = ContractEncoder.encodeErc1155Transfer(sender, recipient, id, amount);

    expect(calldata.startsWith("0xf242432a")).toBe(true);
  });

  it("should encode Permit2 approve and transferFrom calldata", () => {
    const token = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
    const amount = BigInt("1000000000000000000");
    const approveData = ContractEncoder.encodePermit2Approve(token, sender, amount);
    const transferData = ContractEncoder.encodePermit2TransferFrom(
      sender,
      recipient,
      amount,
      token
    );

    expect(approveData.startsWith("0x87517c45")).toBe(true);
    expect(transferData.startsWith("0x36c78516")).toBe(true);
  });

  it("should throw an error when encoding with invalid addresses", () => {
    expect(() => {
      ContractEncoder.encodeErc20Transfer("invalid", BigInt(100));
    }).toThrow(/Invalid recipient address/);

    expect(() => {
      ContractEncoder.encodeErc721Transfer("invalid", recipient, BigInt(1));
    }).toThrow(/Invalid address/);
  });
});
