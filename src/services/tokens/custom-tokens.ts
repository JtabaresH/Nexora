import { KnownTokenConfig } from "@/config/contracts";

const STORAGE_KEY = "nexora_custom_tokens";

export class CustomTokenService {
  /**
   * Retrieves all imported custom tokens for a specific chain
   */
  static getCustomTokens(chainId: number): KnownTokenConfig[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const all: KnownTokenConfig[] = JSON.parse(stored);
      return all.filter((t) => t.chainId === chainId);
    } catch {
      return [];
    }
  }

  /**
   * Adds a new custom ERC-20 token to localStorage
   */
  static addCustomToken(token: KnownTokenConfig): boolean {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all: KnownTokenConfig[] = stored ? JSON.parse(stored) : [];

      // Avoid duplicates
      const exists = all.some(
        (t) =>
          t.address.toLowerCase() === token.address.toLowerCase() &&
          t.chainId === token.chainId
      );
      if (exists) return true;

      all.push(token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Removes an imported custom token
   */
  static removeCustomToken(address: string, chainId: number): void {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const all: KnownTokenConfig[] = JSON.parse(stored);
      const filtered = all.filter(
        (t) =>
          !(
            t.address.toLowerCase() === address.toLowerCase() &&
            t.chainId === chainId
          )
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  }
}
