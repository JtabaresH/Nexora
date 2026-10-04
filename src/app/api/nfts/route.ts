import { NextRequest, NextResponse } from "next/server";
import { NFTIndexerService } from "@/services/nfts/nft-indexer";
import { BlockchainClient } from "@/services/blockchain/viem-client";

/**
 * GET /api/nfts?address=0x...&chainId=480
 *
 * Server-side NFT discovery endpoint.
 * Uses Alchemy first, then Blockscout transfer history as a fallback.
 * ERC-721 and ERC-1155 tokens owned by the given address.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const chainIdStr = searchParams.get("chainId") || "480";
    const chainId = parseInt(chainIdStr, 10);

    if (!address || !BlockchainClient.isValidAddress(address)) {
      return NextResponse.json(
        { error: "Invalid or missing wallet address" },
        { status: 400 }
      );
    }

    if (isNaN(chainId)) {
      return NextResponse.json(
        { error: "Invalid chain ID" },
        { status: 400 }
      );
    }

    const alchemyNfts = await NFTIndexerService.fetchFromAlchemy(address, chainId);
    const explorerNfts = alchemyNfts.length
      ? []
      : await NFTIndexerService.fetchFromExplorer(address, chainId);

    const nftsById = new Map<string, (typeof alchemyNfts)[number]>();
    for (const nft of [...alchemyNfts, ...explorerNfts]) {
      const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
      if (!nftsById.has(key)) {
        nftsById.set(key, nft);
      }
    }
    const nfts = Array.from(nftsById.values());

    // Serialize BigInt values for JSON transport
    const serializedNfts = nfts.map((nft) => ({
      ...nft,
      quantity: nft.quantity?.toString() || "1",
    }));

    return NextResponse.json({
      nfts: serializedNfts,
      totalCount: serializedNfts.length,
      chainId,
      address,
    });
  } catch (err) {
    console.error("NFT API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 500 }
    );
  }
}
