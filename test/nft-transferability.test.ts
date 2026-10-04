import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  HttpRequestError,
} from "viem";
import { nftTransferErrorsAbi } from "../src/contracts/abis/nft-errors";
import { BlockchainClient } from "../src/services/blockchain/viem-client";
import {
  NFTTransferabilityService,
  TRANSFER_PROBE_RECIPIENT,
} from "../src/services/nfts/nft-transferability";
import type { NFT } from "../src/types/nft";

const owner = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";
const contractAddress = "0x3333333333333333333333333333333333333333";

const erc1155NFT: NFT = {
  contractAddress,
  tokenId: "11",
  standard: "ERC1155",
  chainId: 480,
};

const erc721NFT: NFT = {
  contractAddress,
  tokenId: "12",
  standard: "ERC721",
  chainId: 480,
};

describe("NFTTransferabilityService", () => {
  const simulateContract = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
    simulateContract.mockReset();
  });

  it("returns transferable when the simulated transfer succeeds", async () => {
    simulateContract.mockResolvedValue({});
    vi.spyOn(BlockchainClient, "getClient").mockReturnValue({
      simulateContract,
    } as unknown as ReturnType<typeof BlockchainClient.getClient>);

    await expect(
      NFTTransferabilityService.simulateTransfer({
        nft: erc1155NFT,
        from: owner,
        to: recipient,
        chainId: 480,
      })
    ).resolves.toEqual({ status: "transferable" });
  });

  it("returns the decoded soulbound reason for a custom contract revert", async () => {
    const abi = [...nftTransferErrorsAbi];
    const reverted = new ContractFunctionRevertedError({
      abi,
      data: "0x7a54ebfc",
      functionName: "safeTransferFrom",
    });
    simulateContract.mockRejectedValue(
      new ContractFunctionExecutionError(reverted, {
        abi,
        functionName: "safeTransferFrom",
        args: [],
        contractAddress,
      })
    );
    vi.spyOn(BlockchainClient, "getClient").mockReturnValue({
      simulateContract,
    } as unknown as ReturnType<typeof BlockchainClient.getClient>);

    await expect(
      NFTTransferabilityService.simulateTransfer({
        nft: erc1155NFT,
        from: owner,
        to: recipient,
        chainId: 480,
      })
    ).resolves.toEqual({
      status: "non_transferable",
      errorName: "SoulboundTransfer",
      reason:
        "This NFT is soulbound: its contract does not allow transfers.",
    });
  });

  it("includes an unknown revert selector in the default reason", async () => {
    const abi = [...nftTransferErrorsAbi];
    const reverted = new ContractFunctionRevertedError({
      abi,
      data: "0x12345678",
      functionName: "safeTransferFrom",
    });
    simulateContract.mockRejectedValue(
      new ContractFunctionExecutionError(reverted, {
        abi,
        functionName: "safeTransferFrom",
        args: [],
        contractAddress,
      })
    );
    vi.spyOn(BlockchainClient, "getClient").mockReturnValue({
      simulateContract,
    } as unknown as ReturnType<typeof BlockchainClient.getClient>);

    const result = await NFTTransferabilityService.simulateTransfer({
      nft: erc1155NFT,
      from: owner,
      to: recipient,
      chainId: 480,
    });

    expect(result.status).toBe("non_transferable");
    if (result.status === "non_transferable") {
      expect(result.reason).toContain("0x12345678");
    }
  });

  it.each([
    ["HTTP request", () => new HttpRequestError({ url: "x" })],
    ["other", () => new Error("fetch failed")],
  ])("returns unknown for non-contract %s errors", async (_label, errorFactory) => {
    simulateContract.mockRejectedValue(errorFactory());
    vi.spyOn(BlockchainClient, "getClient").mockReturnValue({
      simulateContract,
    } as unknown as ReturnType<typeof BlockchainClient.getClient>);

    await expect(
      NFTTransferabilityService.simulateTransfer({
        nft: erc1155NFT,
        from: owner,
        to: recipient,
        chainId: 480,
      })
    ).resolves.toEqual({ status: "unknown" });
  });

  it("probes ERC1155 transfers with the dead-address recipient and amount one", async () => {
    simulateContract.mockResolvedValue({});
    vi.spyOn(BlockchainClient, "getClient").mockReturnValue({
      simulateContract,
    } as unknown as ReturnType<typeof BlockchainClient.getClient>);

    await NFTTransferabilityService.checkTransferable(erc1155NFT, owner, 480);

    expect(simulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        account: owner,
        args: [owner, TRANSFER_PROBE_RECIPIENT, 11n, 1n, "0x"],
      })
    );
  });

  it("probes ERC721 transfers with the dead-address recipient and token ID", async () => {
    simulateContract.mockResolvedValue({});
    vi.spyOn(BlockchainClient, "getClient").mockReturnValue({
      simulateContract,
    } as unknown as ReturnType<typeof BlockchainClient.getClient>);

    await NFTTransferabilityService.checkTransferable(erc721NFT, owner, 480);

    expect(simulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        account: owner,
        args: [owner, TRANSFER_PROBE_RECIPIENT, 12n],
      })
    );
  });
});
