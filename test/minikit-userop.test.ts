import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { minikitMock } = vi.hoisted(() => ({
  minikitMock: {
    install: vi.fn(),
    isInstalled: vi.fn(),
    sendTransaction: vi.fn(),
    user: null,
  },
}));

vi.mock("@worldcoin/minikit-js", () => ({ MiniKit: minikitMock }));

import { WorldMiniKitService } from "../src/services/world/minikit";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WorldMiniKitService user operation responses", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    minikitMock.isInstalled.mockReturnValue(true);
  });

  it("returns a userOpHash when MiniKit does not include a transaction hash", async () => {
    const userOpHash = `0x${"1".repeat(64)}`;
    minikitMock.sendTransaction.mockResolvedValue({
      executedWith: "minikit",
      data: { userOpHash },
    });

    const result = await WorldMiniKitService.executeSendTransaction({
      chainId: 480,
      transactions: [{ address: `0x${"2".repeat(40)}`, data: "0x" }],
    });

    expect(result).toEqual({ success: true, userOpHash });
  });
});
