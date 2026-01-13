# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rust/ink! smart contract workspace for Polkadot/Substrate chains. It provides reusable on-chain systems (contracts) and a shared library, with TypeScript tooling for chain interaction.

## Commands

**Setup**: `bash scripts/setup.sh`

**Build contracts**: `bash scripts/build.sh`

**Run all tests**: `bash scripts/test.sh`

**Test a single contract**: `pop test src/systems/<path> --e2e`

**Build a single contract**: `pop build src/systems/<path>`

**Deploy to Paseo testnet**: `bash scripts/deploy.sh`

**Run TypeScript client** (from `examples/reputation-interaction/`):
```sh
bun src/index.ts      # interact with deployed contract
bun src/view.ts       # view contract storage
```

## Architecture

### Workspace Structure
- `src/lib/` - Shared library (`contract_tools`) with common types (`EntityId`, `ContextId`) and utilities (`RunningAverage`)
- `src/systems/` - Re-exports all system contracts via the `systems` crate
  - `registries/contexts/` - Context registry contract
  - `registries/contracts/` - Contract registry contract
  - `reputation/` - Reputation contract
  - `disputes/` - Disputes contract
- `examples/*/contract/` - Example contracts demonstrating system usage

### System Contracts

**registries/contexts** (ContextRegistry) - Shared context ownership registry. Contexts are owned by addresses (typically contracts). Provides `register_context`, `get_owner`, and `is_owner` functions. Used by reputation and disputes for ownership verification.

**registries/contracts** (ContractRegistry) - Versioned contract name registry. Owners can publish new versions under names they control. Tracks contract addresses and metadata URIs per version.

**reputation** - Generic reputation storage layer. References the shared context registry for ownership checks. Context owners can submit/delete reviews on behalf of users. Reviews are keyed by `(context_id, reviewer_address, entity_id)`.

**disputes** - Generic disputes system. References the shared context registry for ownership checks. Context owners can:
- `open_dispute` - Create a dispute with claimant, against entity, and claim URI
- `provide_judgment` - Resolve or dismiss an open dispute with resolution URI
- `get_dispute` - View dispute details

Disputes have statuses: `Open`, `Resolved`, `Dismissed`.

### Context Architecture

```
┌─────────────────────┐
│  Context Registry   │  ← Single source of truth for context ownership
│  (registries/contexts)
└─────────────────────┘
         ▲
         │ cross-contract calls (is_owner)
    ┌────┴────┐
    │         │
┌───┴───┐ ┌───┴───┐
│ Reptn │ │Dispute│
└───────┘ └───────┘
```

Both reputation and disputes contracts take a `context_registry` address in their constructor and verify ownership via cross-contract calls.

### Integration Pattern

External contracts can depend on the `systems` crate with `ink-as-dependency` feature:

```toml
systems = { git = "...", default-features = false, features = ["ink-as-dependency"] }
contract_tools = { git = "...", default-features = false }
```

Then access contracts via:
- `systems::registries::contexts::ContextRegistryRef`
- `systems::registries::contracts::ContractRegistryRef`
- `systems::reputation::ReputationRef`
- `systems::disputes::DisputesRef`

See `examples/reputation-interaction/contract/` for a complete example.

### TypeScript Client

Uses `polkadot-api` with `@polkadot-api/sdk-ink` for type-safe contract interaction. Contract descriptors are generated via `pnpm papi ink add <contract.contract>`.

## ink! Version

This project uses ink! 6.0.0-beta.1 with the `unstable-hostfn` feature enabled.
