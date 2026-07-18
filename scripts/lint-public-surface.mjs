// lint-public-surface.mjs — public-surface conformance for the generated registry.
//
// Two invariants, both fail-closed:
//   1. Every tracked .json file parses.
//   2. Every URL host in the tree is on the PUBLIC allowlist below.
//
// The allowlist is deliberately positive (expected public hosts only) — this
// repo must never carry a deny-list of names that don't belong here. Rome hosts
// are constrained to one label: <app>.<net>.romeprotocol.xyz; anything deeper
// does not belong in the public registry.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXACT = new Set([
  "api.devnet.solana.com",
  "api.testnet.solana.com",
  "api.mainnet-beta.solana.com",
  "explorer.solana.com",
  "github.com",
  "cdn.jsdelivr.net",
  "registry.npmjs.org",
  // third-party testnet endpoints referenced by bridge.json
  "amoy.polygonscan.com",
  "api.avax-test.network",
  "api.testnet.wormholescan.io",
  "ethereum-sepolia-rpc.publicnode.com",
  "iris-api-sandbox.circle.com",
  "rpc-amoy.polygon.technology",
  "sepolia-rollup.arbitrum.io",
  "sepolia.arbiscan.io",
  "sepolia.base.org",
  "sepolia.basescan.org",
  "sepolia.etherscan.io",
  "testnet-rpc.monad.xyz",
  "testnet.monadexplorer.com",
  "testnet.snowtrace.io",
]);
const ROME_PUBLIC = /^[a-z0-9-]+\.(testnet|devnet|mainnet)\.romeprotocol\.xyz$/;

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split("\n");
const failures = [];

for (const f of files) {
  const text = readFileSync(f, "utf8");
  if (f.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (e) {
      failures.push(`${f}: invalid JSON — ${e.message}`);
    }
  }
  if (f === "package-lock.json") {
    // Machine-generated; its one security invariant is provenance: every
    // package must resolve from the npm registry. (funding/homepage URLs
    // in dep metadata are noise, not surface.)
    for (const m of text.matchAll(/"resolved":\s*"([^"]+)"/g)) {
      if (!m[1].startsWith("https://registry.npmjs.org/")) {
        failures.push(`${f}: package resolved outside registry.npmjs.org — ${m[1]}`);
      }
    }
    continue;
  }
  for (const m of text.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)) {
    const host = m[1].toLowerCase();
    if (!EXACT.has(host) && !ROME_PUBLIC.test(host)) {
      failures.push(`${f}: host not on the public allowlist — ${host}`);
    }
  }
}

if (failures.length) {
  console.error(`public-surface lint FAILED (${failures.length}):`);
  for (const line of failures) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`public-surface lint OK — ${files.length} files: JSON validity + host allowlist clean`);
