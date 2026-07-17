# @rome-protocol/registry

Public chain metadata for [Rome](https://github.com/rome-protocol) — the canonical, machine-readable source for chain ids, RPC URLs, contract addresses, token catalogs, oracle feeds, Address Lookup Tables, app deployments, and Solana program ids. **Read it instead of hardcoding these values** in your app; they drift across deploys.

This package is a **generated, read-only projection** of Rome's registry — every field is public-safe by construction (an allowlist generator emits only what's meant to be public, substitutes internal endpoints for their public equivalents, and default-denies everything else). Do not hand-edit; changes come from the generator.

## Install

```
npm install @rome-protocol/registry
```

## Usage

```js
import { getChain, getTokens, getContracts, getPrograms } from "@rome-protocol/registry";

const hadrian = getChain(200010);
// → { chainId, name, network, rpcUrl, explorerUrl, romeEvmProgramId,
//     nativeCurrency, solana: { cluster, explorerUrl, rpc } }

const rpc = hadrian.rpcUrl;                 // the public L2 RPC
const solanaRpc = hadrian.solana.rpc;       // a public Solana RPC for this chain's cluster

const tokens = getTokens(200010);           // gas token + wrapped assets (wUSDC/wETH/wSOL/…)
const factory = getContracts(200010)        // ERC20SPLFactory, Multicall3, …
  .find((c) => c.name === "ERC20SPLFactory");
const programs = getPrograms("devnet");     // name → Solana program id
```

### API

| Function | Returns |
|---|---|
| `listChains()` | every published chain's config |
| `getChain(chainId)` | one chain's config, or `null` |
| `getTokens(chainId)` | token catalog (gas + wrappers) |
| `getContracts(chainId)` | deployed contracts + live addresses |
| `getOracle(chainId)` | oracle factory + feed addresses |
| `getBridge(chainId)` | bridge wiring (CCTP / Wormhole) |
| `getAlts(chainId)` | persistent Address Lookup Tables |
| `getCompoundDeployment(chainId)` / `getAaveDeployment(chainId)` | per-app deployment config |
| `getPrograms(network)` | Solana program ids (`"mainnet"` / `"devnet"`) |
| `getLstMints()` | liquid-staking-token mint catalog |

## Published chains

The registry publishes Rome's public showcase chains. Each carries a public L2 RPC and a public Solana RPC for its cluster.

## Building on Rome with an AI agent?

See [`AGENTS.md`](./AGENTS.md) — the Rome-specific rules a coding agent needs.

## License

MIT
