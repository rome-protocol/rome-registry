import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  listChains,
  getChain,
  getTokens,
  getContracts,
  getCompoundDeployment,
  getAaveDeployment,
  getPrograms,
  getBridge,
} from "./index.mjs";

describe("@rome-protocol/registry — consumer API over the public data", () => {
  it("listChains returns exactly the published showcase chains (Hadrian, Martius, Rubicon)", () => {
    expect(listChains().map((c) => c.chainId).sort((a, b) => a - b)).toEqual([7531, 121214, 200010]);
  });

  it("getChain(200010) is Hadrian with a PUBLIC Solana RPC and no internal host", () => {
    const c = getChain(200010);
    expect(c).toBeTruthy();
    expect(c.name).toContain("Hadrian");
    expect(c.rpcUrl).toMatch(/^https:\/\//);
    expect(c.solana.rpc).toBe("https://api.devnet.solana.com");
    expect(JSON.stringify(c)).not.toContain("sol-api");
  });

  it("getChain of an unpublished chain returns null", () => {
    expect(getChain(999999)).toBeNull();
  });

  it("getTokens(200010) exposes the gas token + wrappers", () => {
    const t = getTokens(200010);
    expect(t.some((x) => x.kind === "gas")).toBe(true);
    expect(t.some((x) => x.symbol === "wUSDC")).toBe(true);
  });

  it("getContracts(200010) exposes live contract addresses", () => {
    const c = getContracts(200010);
    expect(c.find((e) => e.name === "Multicall3")).toBeTruthy();
  });

  it("getCompoundDeployment(200010) and getAaveDeployment(200010) resolve", () => {
    expect(getCompoundDeployment(200010).bulker).toBeTruthy();
    expect(getAaveDeployment(200010).pool).toBeTruthy();
  });

  it("getPrograms('devnet') is a non-empty program-id map", () => {
    expect(Object.keys(getPrograms("devnet")).length).toBeGreaterThan(0);
  });

  it("getChain(7531) is Rubicon with the public mainnet Solana RPC", () => {
    const c = getChain(7531);
    expect(c.name).toContain("Rubicon");
    expect(c.solana.rpc).toBe("https://api.mainnet-beta.solana.com");
  });

  it("the live RomeBridgeWithdraw is 13.0.0 on Rubicon and Hadrian", () => {
    const live = (chainId) =>
      getContracts(chainId)
        .find((e) => e.name === "RomeBridgeWithdraw")
        .versions.filter((v) => v.status === "live");
    expect(live(7531).map((v) => [v.version, v.address])).toEqual([["13.0.0", "0xb444197b16972a926638a96bef73a42937b9ce87"]]);
    expect(live(200010).map((v) => [v.version, v.address])).toEqual([["13.0.0", "0x0063df044995e6d2f24baea4e9d369babb1ad7bf"]]);
  });

  it("Rubicon's bridge does not carry the empty Ethereum Wormhole address", () => {
    // 0x3ee1...c283 has no code on Ethereum; ETH sent there is lost.
    expect(getBridge(7531).sourceEvm).not.toHaveProperty("wormholeTokenBridge");
  });

  it("Rubicon's public data leaves out the Portus market contracts and the romedefi label", () => {
    // Operator decision 2026-10-23: Rubicon is public, Portus stays out.
    expect(getContracts(7531).length).toBeGreaterThan(0);
    expect(getContracts(7531).filter((e) => e.name.startsWith("PortusKaminoMarket"))).toEqual([]);
    const alts = readFileSync(new URL("./chains/7531-rubicon/alts.json", import.meta.url), "utf8");
    expect(alts).not.toContain("romedefi");
  });
});
