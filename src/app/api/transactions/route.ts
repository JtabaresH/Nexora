import { NextRequest, NextResponse } from "next/server";
import { TransactionIndexerService } from "@/services/transactions/tx-indexer";
import { BlockchainClient } from "@/services/blockchain/viem-client";

/**
 * GET /api/transactions?address=0x...&chainId=480&limit=50
 *
 * Server-side transaction history endpoint.
 * Fetches on-chain transaction history from Worldscan API including:
 * - Native ETH transfers
 * - ERC-20 token transfers
 * - ERC-721 NFT transfers
 * - ERC-1155 NFT transfers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const chainIdStr = searchParams.get("chainId") || "480";
    const limitStr = searchParams.get("limit") || "50";
    const chainId = parseInt(chainIdStr, 10);
    const limit = Math.min(parseInt(limitStr, 10) || 50, 100);

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

    const transactions = await TransactionIndexerService.fetchTransactions(
      address,
      chainId,
      limit
    );

    return NextResponse.json({
      transactions,
      totalCount: transactions.length,
      chainId,
      address,
    });
  } catch (err) {
    console.error("Transaction API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
