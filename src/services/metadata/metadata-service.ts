import { NFT, NFTAttribute, NFTStandard } from "@/types/nft";

export interface RawNFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  animation_url?: string;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export class MetadataService {
  private static readonly IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
  ];

  private static readonly ARWEAVE_GATEWAY = "https://arweave.net/";

  /**
   * Resolves any URI (IPFS, Arweave, HTTP, HTTPS) into a clean, safe HTTPS URL.
   */
  static resolveUri(uri: string | undefined | null): string {
    if (!uri || typeof uri !== "string") return "";

    const trimmed = uri.trim();

    // Prevent unsafe schemes
    if (trimmed.startsWith("javascript:") || trimmed.startsWith("vbscript:")) {
      return "";
    }

    // IPFS resolution
    if (trimmed.startsWith("ipfs://")) {
      const path = trimmed.replace(/^ipfs:\/\/?/, "");
      return `${this.IPFS_GATEWAYS[0]}${path}`;
    }

    if (trimmed.includes("/ipfs/")) {
      const parts = trimmed.split("/ipfs/");
      return `${this.IPFS_GATEWAYS[0]}${parts[1]}`;
    }

    // Arweave resolution
    if (trimmed.startsWith("ar://")) {
      const hash = trimmed.replace(/^ar:\/\/?/, "");
      return `${this.ARWEAVE_GATEWAY}${hash}`;
    }

    // Normal HTTPS or HTTP
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    // Base64 Data URI (e.g. data:image/svg+xml;base64,...)
    if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:application/json")) {
      return trimmed;
    }

    return trimmed;
  }

  /**
   * Generates a sleek, modern procedural SVG placeholder if an NFT image is missing.
   */
  static getFallbackImage(tokenId: string, name?: string): string {
    const seed = `${tokenId}-${name || "NFT"}`;
    const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 60) % 360;

    const svg = `
      <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue1}, 75%, 20%)" />
            <stop offset="100%" stop-color="hsl(${hue2}, 70%, 10%)" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#grad)" rx="24" />
        <circle cx="200" cy="180" r="64" fill="none" stroke="hsl(${hue1}, 80%, 60%)" stroke-width="4" opacity="0.6" />
        <circle cx="200" cy="180" r="48" fill="hsl(${hue2}, 70%, 40%)" opacity="0.4" />
        <text x="200" y="290" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="#E2E8F0">
          #${tokenId}
        </text>
        <text x="200" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#94A3B8">
          ${(name || "Digital Collectible").slice(0, 24)}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Safely normalizes raw token metadata into a type-safe NFT entity.
   */
  static normalizeNFT(params: {
    contractAddress: string;
    tokenId: string;
    standard: NFTStandard;
    chainId: number;
    rawMetadata?: RawNFTMetadata | null;
    quantity?: bigint;
    collectionName?: string;
    owner?: string;
    tokenUri?: string;
  }): NFT {
    const {
      contractAddress,
      tokenId,
      standard,
      chainId,
      rawMetadata,
      quantity = BigInt(1),
      collectionName,
      owner,
      tokenUri,
    } = params;

    let resolvedName = rawMetadata?.name?.trim() || `Token #${tokenId}`;
    let resolvedDescription = rawMetadata?.description?.trim() || "";

    // Normalize image source
    const rawImage =
      rawMetadata?.image ||
      rawMetadata?.image_url ||
      rawMetadata?.imageUrl ||
      rawMetadata?.animation_url;

    const resolvedImageUrl = rawImage
      ? this.resolveUri(rawImage)
      : this.getFallbackImage(tokenId, resolvedName);

    // Normalize attributes safely
    const normalizedAttributes: NFTAttribute[] = [];
    if (Array.isArray(rawMetadata?.attributes)) {
      for (const attr of rawMetadata.attributes) {
        if (attr && typeof attr === "object" && attr.trait_type) {
          normalizedAttributes.push({
            trait_type: String(attr.trait_type),
            value: attr.value !== undefined ? String(attr.value) : "",
          });
        }
      }
    }

    return {
      contractAddress,
      tokenId,
      standard,
      chainId,
      name: resolvedName,
      description: resolvedDescription,
      imageUrl: resolvedImageUrl,
      quantity,
      collectionName: collectionName || "World Chain Collectibles",
      owner,
      tokenUri,
      metadataUri: tokenUri ? this.resolveUri(tokenUri) : undefined,
      metadata: rawMetadata || undefined,
      attributes: normalizedAttributes.length > 0 ? normalizedAttributes : undefined,
    };
  }

  /**
   * Fetches and parses JSON metadata from a token URI with timeout and error protection.
   */
  static async fetchMetadata(tokenUri: string): Promise<RawNFTMetadata | null> {
    try {
      const resolved = this.resolveUri(tokenUri);
      if (!resolved) return null;

      // Handle embedded data:application/json
      if (resolved.startsWith("data:application/json")) {
        const base64Index = resolved.indexOf(";base64,");
        if (base64Index !== -1) {
          const jsonStr = atob(resolved.slice(base64Index + 8));
          return JSON.parse(jsonStr);
        }
        const jsonStr = decodeURIComponent(resolved.slice(resolved.indexOf(",") + 1));
        return JSON.parse(jsonStr);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(resolved, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Never crash the UI on remote fetch error
      return null;
    }
  }
}
