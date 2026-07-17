import { describe, it, expect } from "vitest";
import {
  listChains,
  getChain,
  getTokens,
  getContracts,
  getCompoundDeployment,
  getAaveDeployment,
  getPrograms,
} from "./index.mjs";

describe("@rome-protocol/registry — consumer API over the public data", () => {
  it("listChains returns exactly the published showcase chains (Hadrian + Martius)", () => {
    expect(listChains().map((c) => c.chainId).sort((a, b) => a - b)).toEqual([121214, 200010]);
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
});
