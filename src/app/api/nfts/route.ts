import { NextRequest, NextResponse } from "next/server";
import { NFTIndexerService } from "@/services/nfts/nft-indexer";
import { BlockchainClient } from "@/services/blockchain/viem-client";

/**
 * GET /api/nfts?address=0x...&chainId=480
 *
 * Server-side NFT discovery endpoint.
 * Uses multi-strategy indexing (Alchemy > Worldscan > RPC) to find all
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

    // Strategy 1: Try Alchemy NFT API first (fastest, most comprehensive)
    let nfts = await NFTIndexerService.fetchFromAlchemy(address, chainId);

    // Strategy 2: Fallback to Worldscan transfer event indexing
    if (nfts.length === 0) {
      nfts = await NFTIndexerService.fetchFromWorldscan(address, chainId);
    }

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
