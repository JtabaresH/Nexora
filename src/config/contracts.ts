export interface KnownTokenConfig {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string;
  chainId: number;
  isNative?: boolean;
}

export const KNOWN_TOKENS_WORLD_CHAIN: KnownTokenConfig[] = [
  {
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // Worldcoin (WLD)
    name: "Worldcoin",
    symbol: "WLD",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/worldcoin-org-wld-logo.png?v=040",
    chainId: 480,
  },
  {
    address: "0x0000000000000000000000000000000000000000", // Native Ether
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
    chainId: 480,
    isNative: true,
  },
  {
    address: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1", // Bridged USDC
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
    chainId: 480,
  },
  {
    address: "0x4200000000000000000000000000000000000006", // Wrapped Ether
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
    chainId: 480,
  },
  {
    address: "0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3", // Wrapped Bitcoin
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    logoUrl: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=040",
    chainId: 480,
  },
  {
    address: "0x8e500B8fE2cAF4332D07FbFB448196e764649F4E", // Worldchain Army
    name: "Worldchain Army",
    symbol: "WARMY",
    decimals: 18,
    logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=WARMY",
    chainId: 480,
  },
];

export const KNOWN_TOKENS_SEPOLIA: KnownTokenConfig[] = [
  {
    address: "0x25aC3205a2f58A43ff5Ceb2c6C227Ab02C637482",
    name: "Test Worldcoin",
    symbol: "tWLD",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/worldcoin-org-wld-logo.png?v=040",
    chainId: 4801,
  },
  {
    address: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88",
    name: "Test USD Coin",
    symbol: "tUSDC",
    decimals: 6,
    logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
    chainId: 4801,
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
    chainId: 4801,
    isNative: true,
  },
];

export const KNOWN_TOKENS_OPTIMISM: KnownTokenConfig[] = [
  {
    address: "0xdC6fF44d5d932Cbe77B5265789585cE527449372",
    name: "Worldcoin",
    symbol: "WLD",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/worldcoin-org-wld-logo.png?v=040",
    chainId: 10,
  },
  {
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
    chainId: 10,
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
    chainId: 10,
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
    chainId: 10,
    isNative: true,
  },
];
