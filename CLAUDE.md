# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rust/ink! smart contract workspace for Polkadot/Substrate chains. It provides reusable on-chain systems (contracts) and shared utilities via the `dapps` crate, with TypeScript tooling for chain interaction.

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
- `src/` - Main `dapps` crate that re-exports everything
  - `core/` - Core types (`EntityId`, `ContextId`, `UUID`) and utilities
    - `math/` - Math utilities (`RunningAverage`)
  - `systems/` - System contracts
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

External contracts depend on the single `dapps` crate with `ink-as-dependency` feature:

```toml
dapps = { git = "...", default-features = false, features = ["ink-as-dependency"] }
```

**Using systems (recommended):** Pre-configured references with placeholder addresses that CI/deployment replaces:

```rust
use dapps::{ContextId, systems};

pub fn new(context_id: ContextId) -> Self {
    let mut context_registry = systems::registries::contexts();
    context_registry.register_context(context_id);

    Self {
        reputation: systems::reputation(),
        context_id,
    }
}
```

Available via systems:
- `systems::registries::contexts()` → ContextRegistryRef
- `systems::registries::contracts()` → ContractRegistryRef
- `systems::reputation()` → ReputationRef
- `systems::disputes()` → DisputesRef

**Core types at root level:**
- `dapps::EntityId` - Identifier for any unique entity
- `dapps::ContextId` - Identifier for a context owned by an address
- `dapps::UUID` - 32-byte unique identifier

**Math utilities:**
```rust
use dapps::math::RunningAverage;
```

**Manual references:** For explicit type access:
- `dapps::registries::contexts::ContextRegistryRef`
- `dapps::registries::contracts::ContractRegistryRef`
- `dapps::reputation::ReputationRef`
- `dapps::disputes::DisputesRef`

See `examples/reputation-interaction/contract/` for a complete example.

### TypeScript Client

Uses `polkadot-api` with `@polkadot-api/sdk-ink` for type-safe contract interaction. Contract descriptors are generated via `pnpm papi ink add <contract.contract>`.

## ink! Version

This project uses ink! 6.0.0-beta.1 with the `unstable-hostfn` feature enabled.
