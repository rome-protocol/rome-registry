import { describe, it, expect } from "vitest";
import {
  listChains,
  getChain,
  getTokens,
  getContracts,
  getCompoundDeployment,
  getAaveDeployment,
  getPrograms,
  getBridge,
  getAgglayerDeployment,
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

  it("getAgglayerDeployment(200010) is Rome's own Stage 1 AggLayer, not Polygon's", () => {
    const d = getAgglayerDeployment(200010);
    expect(d.deployment).toBe("stage1-own-agglayer");
    expect(d.note).toMatch(/NOT Polygon/);
    expect(d.networkId).toBe(1);
    expect(d.hadrian.chainId).toBe(200010);
    expect(d.sepolia.chainId).toBe(11155111);
  });

  it("the AggLayer entry names its Rome and L1 sections, and each name is a real section", () => {
    const d = getAgglayerDeployment(200010);
    expect(d.chainSlug).toBe("hadrian");
    expect(d.l1Slug).toBe("sepolia");
    expect(d.l1ChainId).toBe(11155111);
    expect(d[d.chainSlug].chainId).toBe(d.chainId);
    expect(d[d.l1Slug].chainId).toBe(d.l1ChainId);
  });

  it("every AggLayer address is a well-formed 20-byte address and none repeats by mistake", () => {
    const d = getAgglayerDeployment(200010);
    const addrs = [];
    const walk = (o) => {
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string" && /^0x/.test(v)) addrs.push([k, v]);
        else if (v && typeof v === "object") walk(v);
      }
    };
    walk(d);
    expect(addrs.length).toBe(15);
    for (const [k, a] of addrs) expect(a, k).toMatch(/^0x[0-9a-f]{40}$/);
    // proxies and implementations are different contracts
    expect(d.hadrian.bridge.proxy).not.toBe(d.hadrian.bridge.implementation);
    expect(d.hadrian.globalExitRootManager.proxy).not.toBe(d.hadrian.globalExitRootManager.implementation);
    // the SPL adapter factory is its own contract, not the bridge
    expect(d.hadrian.splAdapterFactory.address).not.toBe(d.hadrian.bridge.proxy);
    // start blocks are positive integers
    for (const n of [d.hadrian.bridgeStartBlock, d.hadrian.gerStartBlock, d.sepolia.l1StartBlock, d.sepolia.rollupCreationBlock]) {
      expect(Number.isInteger(n) && n > 0).toBe(true);
    }
    expect(d.sepolia.rollupCreationBlock).toBeGreaterThan(d.sepolia.l1StartBlock);
  });

  it("getAgglayerDeployment of an unpublished chain returns null", () => {
    expect(getAgglayerDeployment(999999)).toBeNull();
  });
});
