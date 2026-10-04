import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionIndexerService } from "../src/services/transactions/tx-indexer";

const OWNER = "0xd79ee927385f9cc973e95525caff6ba056269474";
const OTHER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const HASH_1 = `0x${"1".repeat(64)}`;
const HASH_2 = `0x${"2".repeat(64)}`;
const HASH_3 = `0x${"3".repeat(64)}`;

function mockExplorer(responses: Record<string, { status: string; result: unknown }>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const action = new URL(String(input)).searchParams.get("action") || "";
    return {
      ok: true,
      json: async () => responses[action] ?? { status: "0", result: [] },
    } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function normalTx(hash: string, overrides: Record<string, string> = {}) {
  return {
    hash,
    from: OWNER,
    to: OTHER,
    value: "1000000000000000000",
    timeStamp: "1700000000",
    blockNumber: "100",
    isError: "0",
    txreceipt_status: "1",
    ...overrides,
  };
}

function internalTx(hash: string, overrides: Record<string, string> = {}) {
  return {
    transactionHash: hash,
    from: OWNER,
    to: OTHER,
    value: "1000000000000000000",
    timeStamp: "1700000000",
    blockNumber: "100",
    isError: "0",
    callType: "call",
    ...overrides,
  };
}

function tokenTx(hash: string, from: string, to: string) {
  return {
    hash,
    from,
    to,
    value: "2500000",
    tokenName: "USD Coin",
    tokenSymbol: "USDC",
    tokenDecimal: "6",
    contractAddress: OTHER,
    timeStamp: "1700000000",
    blockNumber: "100",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TransactionIndexerService", () => {
  it("maps ERC-20 sends and receives", async () => {
    mockExplorer({
      tokentx: {
        status: "1",
        result: [tokenTx(HASH_1, OWNER, OTHER), tokenTx(HASH_2, OTHER, OWNER)],
      },
    });

    const transactions = await TransactionIndexerService.fetchTransactions(OWNER, 480);

    expect(transactions.map((tx) => tx.type)).toEqual(["TOKEN_SEND", "TOKEN_RECEIVE"]);
    expect(transactions.map((tx) => tx.amount)).toEqual(["2.5000", "2.5000"]);
  });

  it("keeps only successful internal call transfers with nonzero value", async () => {
    mockExplorer({
      txlistinternal: {
        status: "2",
        result: [
          internalTx(HASH_1),
          internalTx(HASH_2, { callType: "delegatecall" }),
          internalTx(HASH_3, { value: "0" }),
          internalTx(`0x${"4".repeat(64)}`, { isError: "1" }),
        ],
      },
    });

    const transactions = await TransactionIndexerService.fetchTransactions(OWNER, 480);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      hash: HASH_1,
      type: "TOKEN_SEND",
      assetSymbol: "ETH",
      amount: "1.0000",
    });
  });

  it("accepts result arrays when Blockscout status is 2", async () => {
    mockExplorer({
      tokentx: {
        status: "2",
        result: [tokenTx(HASH_1, OTHER, OWNER)],
      },
    });

    const transactions = await TransactionIndexerService.fetchTransactions(OWNER, 480);

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe("TOKEN_RECEIVE");
  });

  it("suppresses normal and internal ETH entries covered by token activity", async () => {
    mockExplorer({
      txlist: { status: "1", result: [normalTx(HASH_1)] },
      txlistinternal: { status: "2", result: [internalTx(HASH_1)] },
      tokentx: { status: "1", result: [tokenTx(HASH_1, OWNER, OTHER)] },
    });

    const transactions = await TransactionIndexerService.fetchTransactions(OWNER, 480);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({ hash: HASH_1, type: "TOKEN_SEND" });
  });

  it("deduplicates normal and internal ETH by hash and direction", async () => {
    mockExplorer({
      txlist: { status: "1", result: [normalTx(HASH_1)] },
      txlistinternal: { status: "2", result: [internalTx(HASH_1)] },
    });

    const transactions = await TransactionIndexerService.fetchTransactions(OWNER, 480);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({ hash: HASH_1, type: "TOKEN_SEND" });
  });

  it("returns an empty history for V1-style error payloads", async () => {
    const fetchMock = mockExplorer({
      txlist: { status: "0", result: "You are using a deprecated V1 endpoint" },
      txlistinternal: { status: "0", result: "You are using a deprecated V1 endpoint" },
      tokentx: { status: "0", result: "You are using a deprecated V1 endpoint" },
      tokennfttx: { status: "0", result: "You are using a deprecated V1 endpoint" },
      token1155tx: { status: "0", result: "You are using a deprecated V1 endpoint" },
    });

    await expect(TransactionIndexerService.fetchTransactions(OWNER, 480)).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
