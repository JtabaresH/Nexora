export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  logoUrl?: string;
  chainId: number;
  usdPrice?: number;
  priceChange24h?: number;
  isNative?: boolean;
  isCustom?: boolean;
}

export interface FormattedTokenBalance {
  formatted: string;
  usdValue: string | null;
}
