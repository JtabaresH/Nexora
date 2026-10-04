import { encodeFunctionData, isAddress } from "viem";
import { erc20Abi } from "./abis/erc20";
import { erc721Abi } from "./abis/erc721";
import { erc1155Abi } from "./abis/erc1155";
import { MAX_UINT160, permit2Abi } from "./abis/permit2";

export class ContractEncoder {
  /**
   * Encodes an ERC-20 transfer call
   */
  static encodeErc20Transfer(recipient: string, amount: bigint): `0x${string}` {
    if (!isAddress(recipient)) {
      throw new Error(`Invalid recipient address: ${recipient}`);
    }
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient as `0x${string}`, amount],
    });
  }

  /**
   * Encodes an ERC-721 safeTransferFrom call
   */
  static encodeErc721Transfer(
    from: string,
    to: string,
    tokenId: bigint
  ): `0x${string}` {
    if (!isAddress(from) || !isAddress(to)) {
      throw new Error("Invalid address provided for ERC-721 transfer");
    }
    return encodeFunctionData({
      abi: erc721Abi,
      functionName: "safeTransferFrom",
      args: [from as `0x${string}`, to as `0x${string}`, tokenId],
    });
  }

  /**
   * Encodes an ERC-1155 safeTransferFrom call
   */
  static encodeErc1155Transfer(
    from: string,
    to: string,
    id: bigint,
    amount: bigint,
    data: `0x${string}` = "0x"
  ): `0x${string}` {
    if (!isAddress(from) || !isAddress(to)) {
      throw new Error("Invalid address provided for ERC-1155 transfer");
    }
    return encodeFunctionData({
      abi: erc1155Abi,
      functionName: "safeTransferFrom",
      args: [from as `0x${string}`, to as `0x${string}`, id, amount, data],
    });
  }

  static toPermit2Amount(amount: bigint): bigint {
    if (amount < BigInt(0)) {
      throw new Error("Transfer amount must be greater than zero");
    }
    if (amount > MAX_UINT160) {
      throw new Error("Transfer amount exceeds Permit2 uint160 limit");
    }
    return amount;
  }

  /**
   * Permit2 AllowanceTransfer approve — required by World App MiniKit v2.
   * Expiration must be 0 so the approval is consumed in the same sendTransaction.
   */
  static encodePermit2Approve(
    token: string,
    spender: string,
    amount: bigint
  ): `0x${string}` {
    if (!isAddress(token) || !isAddress(spender)) {
      throw new Error("Invalid token or spender address for Permit2 approve");
    }
    return encodeFunctionData({
      abi: permit2Abi,
      functionName: "approve",
      args: [token as `0x${string}`, spender as `0x${string}`, this.toPermit2Amount(amount), 0],
    });
  }

  /**
   * Permit2 AllowanceTransfer transferFrom — pulls tokens to the recipient
   * without calling the ERC-20 contract as a MiniKit entrypoint.
   */
  static encodePermit2TransferFrom(
    from: string,
    to: string,
    amount: bigint,
    token: string
  ): `0x${string}` {
    if (!isAddress(from) || !isAddress(to) || !isAddress(token)) {
      throw new Error("Invalid address provided for Permit2 transferFrom");
    }
    return encodeFunctionData({
      abi: permit2Abi,
      functionName: "transferFrom",
      args: [
        from as `0x${string}`,
        to as `0x${string}`,
        this.toPermit2Amount(amount),
        token as `0x${string}`,
      ],
    });
  }
}
