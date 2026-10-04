export type UserOpResolution =
  | { status: "success"; transactionHash: string }
  | { status: "failed"; transactionHash?: string }
  | { status: "timeout" };

interface UserOpStatusResponse {
  status?: string;
  transactionHash?: string | null;
}

export class UserOperationService {
  static async waitForTransactionHash(
    userOpHash: string,
    opts?: { timeoutMs?: number; intervalMs?: number }
  ): Promise<UserOpResolution> {
    const timeoutMs = opts?.timeoutMs ?? 60_000;
    const intervalMs = opts?.intervalMs ?? 2_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const response = await fetch(`/api/userop/${userOpHash}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const data = (await response.json()) as UserOpStatusResponse;
          if (data.status === "success" && data.transactionHash) {
            return { status: "success", transactionHash: data.transactionHash };
          }
          if (data.status === "failed") {
            return {
              status: "failed",
              ...(data.transactionHash ? { transactionHash: data.transactionHash } : {}),
            };
          }
        }
      } catch {
        // Keep polling until the deadline.
      }

      const remainingMs = deadline - Date.now();
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(intervalMs, remainingMs)));
      }
    }

    return { status: "timeout" };
  }
}
