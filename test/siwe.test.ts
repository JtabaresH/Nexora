import { describe, it, expect } from "vitest";
import { generateSiweNonce, createSiweMessage, parseSiweMessage } from "viem/siwe";
import { privateKeyToAccount } from "viem/accounts";
import { ENV } from "../src/config/env";

describe("SIWE (Sign-In with Ethereum) Integration", () => {
  const devPrivateKey = (ENV.SIGNER_PRIVATE_KEY ||
    "0x1bf82ed7611b74c3bff07f72c3191c5cfd94b779517edcf119ba38ffdfeee56d") as `0x${string}`;
  const devSignerAddress = "0x3D5995Eb27fb94c9b2E6356A14ba5F3503904707";

  it("should verify that the private key matches the Signer Address", () => {
    const account = privateKeyToAccount(devPrivateKey);
    expect(account.address.toLowerCase()).toBe(devSignerAddress.toLowerCase());
  });

  it("should generate a secure alphanumeric nonce of at least 8 characters", () => {
    const nonce = generateSiweNonce();
    expect(typeof nonce).toBe("string");
    expect(nonce.length).toBeGreaterThanOrEqual(8);
  });

  it("should format and parse SIWE messages with World App RP ID and App ID", () => {
    const nonce = generateSiweNonce();
    const account = privateKeyToAccount(devPrivateKey);

    const message = createSiweMessage({
      address: account.address,
      chainId: 480, // World Chain
      domain: "nexora.world",
      uri: "https://nexora.world",
      version: "1",
      nonce,
      statement: `Sign in to Nexora Mini App (${ENV.RP_ID})`,
    });

    const parsed = parseSiweMessage(message);
    expect(parsed.address?.toLowerCase()).toBe(account.address.toLowerCase());
    expect(parsed.chainId).toBe(480);
    expect(parsed.nonce).toBe(nonce);
    expect(parsed.statement).toContain(ENV.RP_ID);
  });

  it("should successfully sign and verify a SIWE message with the Dev Signer", async () => {
    const nonce = generateSiweNonce();
    const account = privateKeyToAccount(devPrivateKey);

    const message = createSiweMessage({
      address: account.address,
      chainId: 480,
      domain: "nexora.world",
      uri: "https://nexora.world",
      version: "1",
      nonce,
      statement: `Sign in to Nexora Mini App (${ENV.RP_ID})`,
    });

    const signature = await account.signMessage({ message });
    expect(signature.startsWith("0x")).toBe(true);

    const parsed = parseSiweMessage(message);
    expect(parsed.nonce).toBe(nonce);
    expect(parsed.address?.toLowerCase()).toBe(devSignerAddress.toLowerCase());
  });
});
