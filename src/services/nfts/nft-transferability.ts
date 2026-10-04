import { BaseError, ContractFunctionRevertedError } from "viem";
import { erc1155Abi } from "@/contracts/abis/erc1155";
import { erc721Abi } from "@/contracts/abis/erc721";
import { nftTransferErrorsAbi } from "@/contracts/abis/nft-errors";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { NFT } from "@/types/nft";

export type NFTTransferability =
  | { status: "transferable" }
  | { status: "non_transferable"; reason: string; errorName?: string }
  | { status: "unknown" };

export const TRANSFER_PROBE_RECIPIENT =
  "0x000000000000000000000000000000000000dEaD";

export class NFTTransferabilityService {
  static async simulateTransfer(p: {
    nft: NFT;
    from: string;
    to: string;
    quantity?: bigint;
    chainId: number;
  }): Promise<NFTTransferability> {
    const { nft, from, to, quantity, chainId } = p;

    try {
      const client = BlockchainClient.getClient(chainId);
      const sender = from as `0x${string}`;
      const recipient = to as `0x${string}`;
      const tokenId = BigInt(nft.tokenId);

      if (nft.standard === "ERC721") {
        await client.simulateContract({
          address: nft.contractAddress as `0x${string}`,
          abi: [...erc721Abi, ...nftTransferErrorsAbi],
          functionName: "safeTransferFrom",
          args: [sender, recipient, tokenId],
          account: sender,
        });
      } else {
        await client.simulateContract({
          address: nft.contractAddress as `0x${string}`,
          abi: [...erc1155Abi, ...nftTransferErrorsAbi],
          functionName: "safeTransferFrom",
          args: [sender, recipient, tokenId, quantity ?? 1n, "0x"],
          account: sender,
        });
      }

      return { status: "transferable" };
    } catch (err) {
      if (err instanceof BaseError) {
        const revert = err.walk(
          (error) => error instanceof ContractFunctionRevertedError
        );

        if (revert instanceof ContractFunctionRevertedError) {
          const revertData = revert.data as
            | { errorName?: string; signature?: string }
            | undefined;
          const errorName =
            revertData?.errorName ??
            revertData?.signature ??
            (revert as ContractFunctionRevertedError & { signature?: string })
              .signature;

          return {
            status: "non_transferable",
            reason: getTransferRevertReason(errorName),
            errorName,
          };
        }
      }

      return { status: "unknown" };
    }
  }

  static async checkTransferable(
    nft: NFT,
    owner: string,
    chainId: number
  ): Promise<NFTTransferability> {
    return this.simulateTransfer({
      nft,
      from: owner,
      to: TRANSFER_PROBE_RECIPIENT,
      quantity: 1n,
      chainId,
    });
  }
}

function getTransferRevertReason(errorName?: string): string {
  switch (errorName) {
    case "SoulboundTransfer":
      return "This NFT is soulbound: its contract does not allow transfers.";
    case "ERC1155InsufficientBalance":
    case "ERC721IncorrectOwner":
      return "You don't own enough of this NFT to transfer it.";
    case "ERC1155InvalidReceiver":
    case "ERC721InvalidReceiver":
      return "The recipient address cannot receive this NFT.";
    case "ERC721NonexistentToken":
      return "This token no longer exists.";
    default:
      return `The NFT contract rejected the transfer (${errorName ?? "reverted"}).`;
  }
}
