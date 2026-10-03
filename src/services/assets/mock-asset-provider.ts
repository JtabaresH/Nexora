import { AssetProvider } from "./types";
import { Token } from "@/types/token";
import { NFT } from "@/types/nft";
import { Transaction } from "@/types/transaction";
import { parseUnits } from "viem";

export class MockAssetProvider implements AssetProvider {
  async getTokens(address: string, chainId: number): Promise<Token[]> {
    return [
      {
        address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        name: "Worldcoin",
        symbol: "WLD",
        decimals: 18,
        balance: parseUnits("245.30", 18),
        logoUrl: "https://cryptologos.cc/logos/worldcoin-org-wld-logo.png?v=040",
        chainId,
        usdPrice: 2.18,
        priceChange24h: 4.8,
      },
      {
        address: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        balance: parseUnits("420.00", 6),
        logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
        chainId,
        usdPrice: 1.0,
        priceChange24h: 0.02,
      },
      {
        address: "0x0000000000000000000000000000000000000000",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        balance: parseUnits("0.112", 18),
        logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040",
        chainId,
        usdPrice: 2650.0,
        priceChange24h: 1.8,
        isNative: true,
      },
      {
        address: "0x91834928A4372A1B6C4F4E2D898284729104A41B",
        name: "Community Token XYZ",
        symbol: "XYZ",
        decimals: 18,
        balance: parseUnits("82.50", 18),
        logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=XYZ",
        chainId,
        // Price deliberately undefined to demonstrate "Price unavailable" state!
        usdPrice: undefined,
      },
    ];
  }

  async getNFTs(address: string, chainId: number): Promise<NFT[]> {
    return [
      {
        contractAddress: "0xWorldPassportContract72100000000000000001",
        tokenId: "381",
        standard: "ERC721",
        name: "Cyber World #381",
        description: "Official World Chain Genesis Explorer identity passport with verified Iris biometrics.",
        imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80",
        collectionName: "Cyber World",
        collectionDescription: "Cybernetic identity badges for early World Chain ecosystem participants.",
        owner: address,
        chainId,
        attributes: [
          { trait_type: "Class", value: "Explorer" },
          { trait_type: "Verification Level", value: "Orb Verified" },
          { trait_type: "Edition", value: "Genesis" },
          { trait_type: "Hardware", value: "Iris v2.4" },
        ],
      },
      {
        contractAddress: "0xWorldPassportContract72100000000000000001",
        tokenId: "892",
        standard: "ERC721",
        name: "Cyber World #892",
        description: "Gold tier proof-of-humanity citizen identity credential.",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        collectionName: "Cyber World",
        collectionDescription: "Cybernetic identity badges for early World Chain ecosystem participants.",
        owner: address,
        chainId,
        attributes: [
          { trait_type: "Class", value: "Architect" },
          { trait_type: "Verification Level", value: "Orb Gold" },
          { trait_type: "Edition", value: "Rare" },
        ],
      },
      {
        contractAddress: "0xOrbArtifactsContract11550000000000000002",
        tokenId: "12",
        standard: "ERC1155",
        name: "Cyber Sword",
        description: "Multi-utility cyber weapon forge token used in decentralized gaming mini apps.",
        imageUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80",
        quantity: BigInt(4),
        collectionName: "Orb Artifacts",
        collectionDescription: "Collectible multi-edition items forged through World ID achievements.",
        owner: address,
        chainId,
        attributes: [
          { trait_type: "Type", value: "Relic" },
          { trait_type: "Power", value: "95" },
          { trait_type: "Socket", value: "Prismatic" },
        ],
      },
      {
        contractAddress: "0xOrbArtifactsContract11550000000000000002",
        tokenId: "45",
        standard: "ERC1155",
        name: "Iris Energy Shard",
        description: "High-density cryptographic energy crystal providing fee boost on Mini Apps.",
        imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80",
        quantity: BigInt(10),
        collectionName: "Orb Artifacts",
        collectionDescription: "Collectible multi-edition items forged through World ID achievements.",
        owner: address,
        chainId,
        attributes: [
          { trait_type: "Purity", value: "99.9%" },
          { trait_type: "Element", value: "Resonance" },
        ],
      },
      {
        contractAddress: "0xNexoraPassContract72100000000000000003",
        tokenId: "1",
        standard: "ERC721",
        name: "Nexora Pioneer Pass",
        description: "Exclusive founding member pass providing zero-fee swaps and priority Mini App routing.",
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80",
        collectionName: "Nexora Ecosystem",
        collectionDescription: "Official utility passes and badges for the Nexora Mini App.",
        owner: address,
        chainId,
        attributes: [
          { trait_type: "Access", value: "Founder VIP" },
          { trait_type: "Multiplier", value: "2x Rewards" },
        ],
      },
    ];
  }

  async getTransactions(address: string, chainId: number): Promise<Transaction[]> {
    const now = Date.now();
    return [
      {
        hash: "0x4e29b19e93dfbf158b4b7324fa218e8dfac21bfa98e3b5dfd48259b109e248b1",
        type: "TOKEN_RECEIVE",
        status: "CONFIRMED",
        from: "0x9812A43fC97E42A8C4B8462bA7c490a02B5B4920",
        to: address,
        assetSymbol: "WLD",
        assetName: "Worldcoin",
        amount: "25",
        timestamp: now - 1000 * 60 * 18, // 18 mins ago
        blockNumber: 12489210,
        chainId,
      },
      {
        hash: "0x7a39d84c12fe294bb84218841a021948ba28172948bb1947291a9284729104fa",
        type: "TOKEN_SEND",
        status: "CONFIRMED",
        from: address,
        to: "0x123456789012345678901234567890123456ABCD",
        assetSymbol: "USDC",
        assetName: "USD Coin",
        amount: "12",
        timestamp: now - 1000 * 60 * 60 * 22, // Yesterday
        blockNumber: 12478100,
        chainId,
      },
      {
        hash: "0x1c8b742a0b384619375017264901928475930284750192847501928475019284",
        type: "NFT_RECEIVE",
        status: "CONFIRMED",
        from: "0x71C93821034872910485720194857291048592FC",
        to: address,
        assetName: "Cyber World #381",
        tokenId: "381",
        standard: "ERC721",
        contractAddress: "0xWorldPassportContract72100000000000000001",
        timestamp: now - 1000 * 60 * 60 * 48,
        blockNumber: 12465000,
        chainId,
      },
      {
        hash: "0x82f9183492817482910485720194857291048592817482910485720194857291",
        type: "TOKEN_SEND",
        status: "PENDING",
        from: address,
        to: "0x3948572019485729104857201948572019485720",
        assetSymbol: "WLD",
        assetName: "Worldcoin",
        amount: "50",
        timestamp: now - 1000 * 45, // 45 seconds ago
        chainId,
      },
      {
        hash: "0xdeadbeef18349281748291048572019485729104859281748291048572019485",
        type: "TOKEN_SEND",
        status: "FAILED",
        from: address,
        to: "0x5555555555555555555555555555555555555555",
        assetSymbol: "WLD",
        assetName: "Worldcoin",
        amount: "1000",
        errorMessage: "Execution reverted: Insufficient balance",
        timestamp: now - 1000 * 60 * 60 * 72,
        chainId,
      },
    ];
  }
}
