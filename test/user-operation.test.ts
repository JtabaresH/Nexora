import { afterEach, describe, expect, it, vi } from "vitest";
import { UserOperationService } from "../src/services/world/user-operation";

const HASH = `0x${"1".repeat(64)}`;
const TX_HASH = `0x${"2".repeat(64)}`;

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("UserOperationService", () => {
  it("waits through pending statuses until a transaction hash is available", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ status: "pending" }))
      .mockResolvedValueOnce(response({ status: "pending" }))
      .mockResolvedValueOnce(response({ status: "success", transactionHash: TX_HASH }));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();

    const resultPromise = UserOperationService.waitForTransactionHash(HASH, {
      timeoutMs: 5000,
      intervalMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(2000);

    await expect(resultPromise).resolves.toEqual({
      status: "success",
      transactionHash: TX_HASH,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(`/api/userop/${HASH}`, { cache: "no-store" });
  });

  it("returns failed when the operation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ status: "failed", transactionHash: TX_HASH }))
    );

    await expect(UserOperationService.waitForTransactionHash(HASH)).resolves.toEqual({
      status: "failed",
      transactionHash: TX_HASH,
    });
  });

  it("keeps polling after fetch exceptions", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(response({ status: "success", transactionHash: TX_HASH }));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();

    const resultPromise = UserOperationService.waitForTransactionHash(HASH, {
      timeoutMs: 5000,
      intervalMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);

    await expect(resultPromise).resolves.toEqual({
      status: "success",
      transactionHash: TX_HASH,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns timeout when the deadline elapses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ status: "pending" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();

    const resultPromise = UserOperationService.waitForTransactionHash(HASH, {
      timeoutMs: 5000,
      intervalMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(5000);

    await expect(resultPromise).resolves.toEqual({ status: "timeout" });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("continues polling when success has a null transaction hash", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ status: "success", transactionHash: null }))
      .mockResolvedValueOnce(response({ status: "success", transactionHash: TX_HASH }));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();

    const resultPromise = UserOperationService.waitForTransactionHash(HASH, {
      timeoutMs: 5000,
      intervalMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);

    await expect(resultPromise).resolves.toEqual({
      status: "success",
      transactionHash: TX_HASH,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
