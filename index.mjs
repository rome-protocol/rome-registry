// @rome-protocol/registry — public Rome chain metadata.
//
// Generated + published from Rome's internal registry (read-only; do not
// hand-edit). Everything here is public-safe by construction. Consume it
// instead of hardcoding chain ids, RPC URLs, contract addresses, or program
// ids in your app.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));

/** @returns {object[]} every published chain's chain.json. */
export function listChains() {
  const dir = path.join(ROOT, "chains");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).map((slug) => readJson(`chains/${slug}/chain.json`));
}

function slugOf(chainId) {
  const dir = path.join(ROOT, "chains");
  if (!existsSync(dir)) return null;
  return readdirSync(dir).find((s) => readJson(`chains/${s}/chain.json`).chainId === chainId) ?? null;
}

/** @returns {object|null} the chain.json for `chainId`, or null if not published. */
export function getChain(chainId) {
  const s = slugOf(chainId);
  return s ? readJson(`chains/${s}/chain.json`) : null;
}

const perChain = (file) => (chainId) => {
  const s = slugOf(chainId);
  return s && existsSync(path.join(ROOT, "chains", s, file)) ? readJson(`chains/${s}/${file}`) : null;
};

export const getTokens = perChain("tokens.json");
export const getContracts = perChain("contracts.json");
export const getOracle = perChain("oracle.json");
export const getBridge = perChain("bridge.json");
export const getAlts = perChain("alts.json");

const perApp = (proto) => (chainId) => {
  const s = slugOf(chainId);
  const rel = `apps/${proto}/${s}.json`;
  return s && existsSync(path.join(ROOT, rel)) ? readJson(rel) : null;
};

export const getCompoundDeployment = perApp("compound");
export const getAaveDeployment = perApp("aave");

/** @param {"mainnet"|"devnet"} network @returns {Record<string,string>} name→programId. */
export function getPrograms(network) {
  const rel = `solana/programs/${network}.json`;
  return existsSync(path.join(ROOT, rel)) ? readJson(rel) : {};
}

/** @returns {object} the mainnet LST-mint catalog. */
export function getLstMints() {
  return readJson("solana/lst-mints/mainnet.json");
}
