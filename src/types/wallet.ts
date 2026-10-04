import { SupportedChainId } from "./network";

export interface WalletAccount {
  address: string;
  username?: string;
  isWorldIdVerified?: boolean;
  avatarUrl?: string;
}

export type WalletProviderType = "minikit" | "injected" | "demo";

export interface TransactionCall {
  address: `0x${string}`;
  abi?: readonly unknown[];
  functionName?: string;
  args?: readonly unknown[];
  data?: `0x${string}`;
  value?: string | bigint;
}

export interface SendTransactionRequest {
  chainId: SupportedChainId;
  transactions: TransactionCall[];
}

export interface SendTransactionResult {
  success: boolean;
  transactionHash?: string;
  userOpHash?: string;
  error?: string;
}

export interface WalletProvider {
  type: WalletProviderType;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getAddress(): Promise<string | null>;
  sendTransaction(tx: SendTransactionRequest): Promise<SendTransactionResult>;
  signMessage(message: string): Promise<string>;
}
