export type TransactionType =
  | "TOKEN_SEND"
  | "TOKEN_RECEIVE"
  | "NFT_SEND"
  | "NFT_RECEIVE";

export type TransactionStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface Transaction {
  hash: string;
  hashKind?: "placeholder" | "userOp";
  userOpHash?: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to: string;
  assetSymbol?: string;
  assetName?: string;
  amount?: string;
  tokenId?: string;
  standard?: "ERC721" | "ERC1155";
  contractAddress?: string;
  timestamp: number;
  blockNumber?: number;
  chainId: number;
  errorMessage?: string;
}

export type TransactionFilter = "ALL" | "TOKENS" | "NFTS" | "SENT" | "RECEIVED";
