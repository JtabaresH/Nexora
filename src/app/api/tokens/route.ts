import { NextRequest, NextResponse } from "next/server";
import { BlockchainClient } from "@/services/blockchain/viem-client";
import { TokenIndexerService } from "@/services/tokens/token-indexer";

/**
 * GET /api/tokens?address=0x...&chainId=480
 *
 * Discovers ERC-20 balances for the wallet, including tokens created in World App.
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
      return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
    }

    const tokens = await TokenIndexerService.fetchHeldTokens(address, chainId);

    return NextResponse.json({
      tokens,
      totalCount: tokens.length,
      chainId,
      address,
    });
  } catch (err) {
    console.error("Token API error:", err);
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}
