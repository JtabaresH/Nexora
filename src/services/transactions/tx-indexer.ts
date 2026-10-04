import { Transaction, TransactionType } from "@/types/transaction";
import { getExplorerApiUrl } from "@/config/networks";

/**
 * Blockscout/Etherscan API response types
 */
interface EtherscanNormalTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  blockNumber: string;
  isError: string;
  txreceipt_status: string;
  functionName?: string;
  contractAddress?: string;
}

interface EtherscanErc20Tx {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  timeStamp: string;
  blockNumber: string;
}

interface EtherscanNFTTx {
  hash: string;
  from: string;
  to: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  timeStamp: string;
  blockNumber: string;
  tokenValue?: string; // ERC-1155 quantity
}

interface EtherscanInternalTx {
  transactionHash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  blockNumber: string;
  isError: string;
  callType: string;
}

/**
 * Transaction Indexer Service
 *
 * Fetches on-chain transaction history from Blockscout (Etherscan-compatible API)
 * for both World Chain mainnet and Sepolia testnet.
 *
 * Fetches:
 * 1. Normal ETH transactions (native transfers)
 * 2. ERC-20 token transfers
 * 3. ERC-721 NFT transfers
 * 4. ERC-1155 NFT transfers
 * 5. Internal ETH transfers
 */
export class TransactionIndexerService {
  /**
   * Fetch all transaction types and merge them into a unified history
   */
  static async fetchTransactions(
    ownerAddress: string,
    chainId: number,
    limit: number = 50
  ): Promise<Transaction[]> {
    const apiUrl = getExplorerApiUrl(chainId);
    if (!apiUrl) return [];

    const address = ownerAddress.toLowerCase();

    // Fetch all transaction types in parallel for speed
    const [ethTxs, internalTxs, erc20Txs, nftTxs, erc1155Txs] = await Promise.all([
      this.fetchNormalTxs(apiUrl, address, chainId),
      this.fetchInternalTxs(apiUrl, address, chainId),
      this.fetchErc20Txs(apiUrl, address, chainId),
      this.fetchErc721Txs(apiUrl, address, chainId),
      this.fetchErc1155Txs(apiUrl, address, chainId),
    ]);

    // Merge and deduplicate by hash (keep the most specific type)
    const txMap = new Map<string, Transaction>();

    // Add NFT transactions first (most specific)
    for (const tx of [...erc1155Txs, ...nftTxs]) {
      const key = `${tx.hash}-${tx.type}-${tx.tokenId || ""}`;
      txMap.set(key, tx);
    }

    // Add ERC-20 transfers
    for (const tx of erc20Txs) {
      const key = `${tx.hash}-${tx.type}-${tx.assetSymbol || ""}`;
      if (!txMap.has(key)) {
        txMap.set(key, tx);
      }
    }

    // Add ETH transfers last, skipping hashes covered by token/NFT activity.
    const tokenAndNftHashes = new Set(
      [...txMap.values()].map((tx) => tx.hash.toLowerCase())
    );
    for (const tx of [...ethTxs, ...internalTxs]) {
      if (tokenAndNftHashes.has(tx.hash.toLowerCase())) continue;
      const key = `${tx.hash.toLowerCase()}-${tx.type}`;
      if (!txMap.has(key)) txMap.set(key, tx);
    }

    // Sort by timestamp descending and limit
    return Array.from(txMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Fetch native ETH transactions
   */
  private static async fetchNormalTxs(
    apiUrl: string,
    address: string,
    chainId: number
  ): Promise<Transaction[]> {
    try {
      const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 30 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.result)) return [];

      return (data.result as EtherscanNormalTx[])
        .filter((tx) => tx.value !== "0")
        .map((tx) => {
          const isReceive = tx.to.toLowerCase() === address;
          const isError = tx.isError === "1" || tx.txreceipt_status === "0";

          // Format ETH value from wei
          const valueInEth = Number(BigInt(tx.value)) / 1e18;
          const formattedAmount =
            valueInEth < 0.0001
              ? valueInEth.toExponential(2)
              : valueInEth < 1
              ? valueInEth.toFixed(6)
              : valueInEth.toFixed(4);

          return {
            hash: tx.hash,
            type: (isReceive ? "TOKEN_RECEIVE" : "TOKEN_SEND") as TransactionType,
            status: isError ? "FAILED" : "CONFIRMED",
            from: tx.from,
            to: tx.to,
            assetSymbol: "ETH",
            assetName: "Ether",
            amount: formattedAmount,
            timestamp: parseInt(tx.timeStamp, 10) * 1000,
            blockNumber: parseInt(tx.blockNumber, 10),
            chainId,
          } as Transaction;
        });
    } catch (err) {
      console.warn("Failed to fetch normal txs:", err);
      return [];
    }
  }

  /**
   * Fetch internal ETH transfers
   */
  private static async fetchInternalTxs(
    apiUrl: string,
    address: string,
    chainId: number
  ): Promise<Transaction[]> {
    try {
      const url = `${apiUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 30 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.result)) return [];

      return (data.result as EtherscanInternalTx[])
        .filter((tx) => tx.value !== "0" && tx.isError !== "1" && tx.callType === "call")
        .map((tx) => {
          const isReceive = tx.to.toLowerCase() === address;
          const valueInEth = Number(BigInt(tx.value)) / 1e18;
          const formattedAmount =
            valueInEth < 0.0001
              ? valueInEth.toExponential(2)
              : valueInEth < 1
              ? valueInEth.toFixed(6)
              : valueInEth.toFixed(4);

          return {
            hash: tx.transactionHash,
            type: (isReceive ? "TOKEN_RECEIVE" : "TOKEN_SEND") as TransactionType,
            status: "CONFIRMED" as const,
            from: tx.from,
            to: tx.to,
            assetSymbol: "ETH",
            assetName: "Ether",
            amount: formattedAmount,
            timestamp: parseInt(tx.timeStamp, 10) * 1000,
            blockNumber: parseInt(tx.blockNumber, 10),
            chainId,
          } as Transaction;
        });
    } catch (err) {
      console.warn("Failed to fetch internal txs:", err);
      return [];
    }
  }

  /**
   * Fetch ERC-20 token transfers
   */
  private static async fetchErc20Txs(
    apiUrl: string,
    address: string,
    chainId: number
  ): Promise<Transaction[]> {
    try {
      const url = `${apiUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 30 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.result)) return [];

      return (data.result as EtherscanErc20Tx[]).map((tx) => {
        const isReceive = tx.to.toLowerCase() === address;
        const decimals = parseInt(tx.tokenDecimal, 10) || 18;
        const rawAmount = BigInt(tx.value);
        const formatted = Number(rawAmount) / Math.pow(10, decimals);

        const amount =
          formatted < 0.0001
            ? formatted.toExponential(2)
            : formatted < 1
            ? formatted.toFixed(6)
            : formatted < 1000
            ? formatted.toFixed(4)
            : formatted.toLocaleString("en-US", { maximumFractionDigits: 2 });

        return {
          hash: tx.hash,
          type: (isReceive ? "TOKEN_RECEIVE" : "TOKEN_SEND") as TransactionType,
          status: "CONFIRMED" as const,
          from: tx.from,
          to: tx.to,
          assetSymbol: tx.tokenSymbol,
          assetName: tx.tokenName,
          amount,
          contractAddress: tx.contractAddress,
          timestamp: parseInt(tx.timeStamp, 10) * 1000,
          blockNumber: parseInt(tx.blockNumber, 10),
          chainId,
        } as Transaction;
      });
    } catch (err) {
      console.warn("Failed to fetch ERC-20 txs:", err);
      return [];
    }
  }

  /**
   * Fetch ERC-721 NFT transfers
   */
  private static async fetchErc721Txs(
    apiUrl: string,
    address: string,
    chainId: number
  ): Promise<Transaction[]> {
    try {
      const url = `${apiUrl}?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 30 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.result)) return [];

      return (data.result as EtherscanNFTTx[]).map((tx) => {
        const isReceive = tx.to.toLowerCase() === address;

        return {
          hash: tx.hash,
          type: (isReceive ? "NFT_RECEIVE" : "NFT_SEND") as TransactionType,
          status: "CONFIRMED" as const,
          from: tx.from,
          to: tx.to,
          assetName: tx.tokenName || `Token #${tx.tokenID}`,
          tokenId: tx.tokenID,
          standard: "ERC721" as const,
          contractAddress: tx.contractAddress,
          amount: "1",
          timestamp: parseInt(tx.timeStamp, 10) * 1000,
          blockNumber: parseInt(tx.blockNumber, 10),
          chainId,
        } as Transaction;
      });
    } catch (err) {
      console.warn("Failed to fetch ERC-721 txs:", err);
      return [];
    }
  }

  /**
   * Fetch ERC-1155 NFT transfers
   */
  private static async fetchErc1155Txs(
    apiUrl: string,
    address: string,
    chainId: number
  ): Promise<Transaction[]> {
    try {
      const url = `${apiUrl}?module=account&action=token1155tx&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 30 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.result)) return [];

      return (data.result as EtherscanNFTTx[]).map((tx) => {
        const isReceive = tx.to.toLowerCase() === address;

        return {
          hash: tx.hash,
          type: (isReceive ? "NFT_RECEIVE" : "NFT_SEND") as TransactionType,
          status: "CONFIRMED" as const,
          from: tx.from,
          to: tx.to,
          assetName: tx.tokenName || `Token #${tx.tokenID}`,
          tokenId: tx.tokenID,
          standard: "ERC1155" as const,
          contractAddress: tx.contractAddress,
          amount: tx.tokenValue || "1",
          timestamp: parseInt(tx.timeStamp, 10) * 1000,
          blockNumber: parseInt(tx.blockNumber, 10),
          chainId,
        } as Transaction;
      });
    } catch (err) {
      console.warn("Failed to fetch ERC-1155 txs:", err);
      return [];
    }
  }
}
