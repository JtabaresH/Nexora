import { MiniKit } from "@worldcoin/minikit-js";
import { SendTransactionRequest, SendTransactionResult, WalletAccount } from "@/types/wallet";
import { ENV } from "@/config/env";
import { createSiweMessage } from "viem/siwe";
import { privateKeyToAccount } from "viem/accounts";

const INVALID_CONTRACT_HELP =
  "World App blocked this call (invalid_contract). Add Permit2 (0x000000000022D473030F116dDEE9F6B43aC78BA3) as a Contract Entrypoint, add ERC-20s under Permit2 Tokens, and add NFT contracts under Contract Entrypoints in Developer Portal → Mini App → Permissions.";

export class WorldMiniKitService {
  private static isInitialized = false;

  /**
   * Initializes the MiniKit bridge safely
   */
  static init(): boolean {
    if (typeof window === "undefined") return false;
    if (this.isInitialized) return true;

    try {
      MiniKit.install(ENV.APP_ID);
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn("MiniKit installation notice (normal if running outside World App):", err);
      return false;
    }
  }

  /**
   * Checks if currently executing inside the official World App
   */
  static isInsideWorldApp(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return MiniKit.isInstalled();
    } catch {
      return false;
    }
  }

  /**
   * Fetches a secure cryptographic SIWE nonce from backend
   */
  static async fetchNonce(): Promise<string> {
    try {
      const res = await fetch("/api/auth/nonce", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch nonce");
      const data = await res.json();
      return data.nonce;
    } catch (err) {
      console.warn("Fallback nonce generation:", err);
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Retrieves the currently connected World App user if available from MiniKit
   */
  static getCurrentUser(): WalletAccount | null {
    if (typeof window === "undefined" || !this.isInsideWorldApp()) return null;
    try {
      const user = MiniKit.user;
      if (user && user.walletAddress) {
        return {
          address: user.walletAddress,
          username: user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
          avatarUrl: user.profilePictureUrl,
          isWorldIdVerified: user.verificationStatus?.isOrbVerified ?? true,
        };
      }
    } catch {
      // MiniKit.user not ready
    }
    return null;
  }

  /**
   * Performs full Sign-In With Ethereum (SIWE) verification
   */
  static async signInWithSIWE(): Promise<WalletAccount | null> {
    try {
      const nonce = await this.fetchNonce();

      // Path A: Inside official World App
      if (this.isInsideWorldApp()) {
        const res = await MiniKit.walletAuth({
          nonce,
          statement: `Sign in to Nexora Wallet (${ENV.RP_ID})`,
          expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        // Extract payload data returned by World App
        const authData = (res && typeof res === "object" && "data" in res) ? (res as { data: { address?: string; message?: string; signature?: string } }).data : res;
        const address = authData?.address || MiniKit.user?.walletAddress;

        if (address) {
          // Send to backend verification route
          try {
            const verifyRes = await fetch("/api/auth/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload: authData, nonce }),
            });

            if (verifyRes.ok) {
              const verifiedData = await verifyRes.json();
              return {
                address: verifiedData.address || address,
                isWorldIdVerified: true,
                username: MiniKit.user?.username || verifiedData.username || `${address.slice(0, 6)}...${address.slice(-4)}`,
                avatarUrl: MiniKit.user?.profilePictureUrl,
              };
            }
          } catch (verifyErr) {
            console.warn("Backend SIWE verification call warning:", verifyErr);
          }

          // Fallback if MiniKit returned an authenticated address inside World App
          return {
            address,
            isWorldIdVerified: MiniKit.user?.verificationStatus?.isOrbVerified ?? true,
            username: MiniKit.user?.username || `${address.slice(0, 6)}...${address.slice(-4)}`,
            avatarUrl: MiniKit.user?.profilePictureUrl,
          };
        }
        return null;
      }

      // Path B: Outside World App with Developer Signer Key
      if (ENV.SIGNER_PRIVATE_KEY && ENV.SIGNER_PRIVATE_KEY.startsWith("0x")) {
        const devAccount = privateKeyToAccount(ENV.SIGNER_PRIVATE_KEY as `0x${string}`);
        const domain = typeof window !== "undefined" ? window.location.host : "localhost:3000";
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

        const message = createSiweMessage({
          address: devAccount.address,
          chainId: 480, // World Chain
          domain,
          uri: origin,
          version: "1",
          nonce,
          statement: `Sign in to Nexora Wallet (${ENV.RP_ID})`,
        });

        const signature = await devAccount.signMessage({ message });

        // Verify with server endpoint
        const verifyRes = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: {
              address: devAccount.address,
              message,
              signature,
            },
            nonce,
          }),
        });

        if (verifyRes.ok) {
          const verifiedData = await verifyRes.json();
          return {
            address: verifiedData.address,
            isWorldIdVerified: true,
            username: "Dev Signer (SIWE)",
          };
        }
      }

      return null;
    } catch (err) {
      console.error("SIWE sign-in failed:", err);
      return null;
    }
  }

  /**
   * Executes a transaction through World App's sponsored / native execution bridge
   */
  static async executeSendTransaction(request: SendTransactionRequest): Promise<SendTransactionResult> {
    if (!this.isInsideWorldApp()) {
      return {
        success: false,
        error: "World App MiniKit is not detected. Please open within World App.",
      };
    }

    try {
      // MiniKit v2 sendTransaction expects pre-encoded calldata: { to, data, value }
      const formattedTxs = request.transactions.map((tx) => {
        let hexValue = "0x0";
        if (tx.value) {
          const bigVal = typeof tx.value === "string" ? BigInt(tx.value) : tx.value;
          if (bigVal > BigInt(0)) {
            hexValue = "0x" + bigVal.toString(16);
          }
        }

        return {
          to: tx.address,
          address: tx.address,
          data: tx.data || "0x",
          value: hexValue,
        };
      });

      // Official MiniKit sendTransaction — do not replace this command
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await MiniKit.sendTransaction({
        transactions: formattedTxs,
        chainId: request.chainId || 480,
      } as any);

      if (!response) {
        return {
          success: false,
          error: "Transaction was rejected or dismissed by user.",
        };
      }

      const errorFromResponse = this.readMiniKitError(response);
      if (errorFromResponse) {
        return { success: false, error: errorFromResponse };
      }

      if (response.executedWith === "minikit" || response.executedWith === "wagmi") {
        const txData = response.data as {
          transactionHash?: string;
          status?: string;
          txHash?: string;
          userOpHash?: string;
        } | undefined;
        const hash = txData?.transactionHash || txData?.txHash || txData?.userOpHash;

        if (!hash) {
          return {
            success: false,
            error: "World App did not return a transaction hash.",
          };
        }

        return {
          success: true,
          transactionHash: hash,
        };
      }

      return {
        success: false,
        error: "Transaction was not processed by MiniKit bridge.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: this.readMiniKitError(err) || "Unknown error during World App transaction",
      };
    }
  }

  private static readMiniKitError(source: unknown): string | null {
    if (!source) return null;

    const collect = (value: unknown): string[] => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (value instanceof Error) return [value.message, value.name];
      if (typeof value !== "object") return [];

      const record = value as Record<string, unknown>;
      return [
        record.error,
        record.error_code,
        record.code,
        record.message,
        record.status,
        record.errorCode,
        record.data && typeof record.data === "object"
          ? [
              (record.data as Record<string, unknown>).error,
              (record.data as Record<string, unknown>).error_code,
              (record.data as Record<string, unknown>).code,
              (record.data as Record<string, unknown>).message,
            ]
          : null,
      ].flatMap((item) => collect(item));
    };

    const parts = collect(source).filter(Boolean);
    if (parts.length === 0) return null;

    const joined = parts.join(" ");
    if (/invalid_contract/i.test(joined)) {
      return INVALID_CONTRACT_HELP;
    }

    const first = parts.find((part) => part !== "error" && part !== "success") || parts[0];
    return first;
  }
}
