# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rust/ink! smart contract workspace for Polkadot/Substrate chains. It provides reusable on-chain systems (contracts) and shared utilities via the `dapps` crate, with TypeScript tooling for chain interaction and deployment.

The project uses the **CDM (Contract Deployment Manager)** system for automated contract deployment and runtime contract linking.

## Commands

**Setup**: `bash scripts/setup.sh`

**Build contracts**: `bash scripts/build.sh`

**Run unit tests**: `bash scripts/test.sh`

**Build a single contract**: `cargo contract build` (from contract directory)

**Integration tests** (requires zombienet running):
```sh
# 1. Start zombienet (from product-preview-net repo)
zombie-cli spawn -p native bin/local-dev.toml

# 2. Deploy contracts
cd scripts/deploy-ts && bun src/deploy.ts

# 3. Run integration test
CONTRACTS_REGISTRY_ADDR=<deployed-addr> bun src/integration-test.ts
```

**Deploy with CDM CLI** (from `src/packages/cdm-cli/`):
```sh
# Build all contracts (requires registry address)
CONTRACTS_REGISTRY_ADDR=0x... bun run dev build

# Deploy to local node
CONTRACTS_REGISTRY_ADDR=0x... bun run dev deploy ws://localhost:9944

# Dry-run to see deployment plan
CONTRACTS_REGISTRY_ADDR=0x... bun run dev deploy --dry-run ws://localhost:9944
```

**Run TypeScript client** (from `examples/market-api/`):
```sh
bun src/index.ts      # interact with deployed contract
bun src/view.ts       # view contract storage
```

## Architecture

### Workspace Structure
```
src/
├── lib.rs                    # Main dapps crate re-exports
├── core/
│   ├── lib.rs               # Core types (EntityId, ContextId, UUID)
│   ├── cdm-macro/           # Procedural macro for CDM reference() generation
│   └── math/                # Math utilities (RunningAverage)
├── systems/                 # System contracts
│   ├── registries/
│   │   ├── contexts/        # Context registry contract
│   │   └── contracts/       # Contract registry (CDM bootstrap)
│   ├── reputation/          # Reputation contract
│   ├── disputes/            # Disputes contract
│   └── entity_graph/        # Entity graph contract
└── packages/
    └── cdm-cli/             # TypeScript CLI for deployment

examples/
├── market-api/              # Example contract using all systems
└── system-basic/
```

### CDM (Contract Deployment Manager)

CDM enables dynamic contract address resolution at runtime, eliminating hardcoded addresses.

**How it works:**
1. **ContractRegistry** is deployed first (bootstrap - no CDM macro)
2. Set `CONTRACTS_REGISTRY_ADDR` env var with the deployed address
3. Rebuild all other contracts with the registry address baked in
4. Deploy contracts in dependency order; each registers itself in the registry
5. At runtime, contracts call `module::reference()` to look up addresses

**The `#[cdm("...")]` macro:**
```rust
#[cdm("@polkadot/reputation")]
#[ink::contract]
mod reputation {
    #[ink(storage)]
    pub struct Reputation { ... }
}

// Generates (when ink-as-dependency feature enabled):
pub fn reference() -> reputation::ReputationRef {
    // Looks up address from contracts registry at runtime
}
```

### System Contracts

**registries/contexts** (ContextRegistry) - Shared context ownership registry. Contexts are owned by addresses (typically contracts). Provides `register_context`, `get_owner`, and `is_owner` functions.

**registries/contracts** (ContractRegistry) - CDM bootstrap contract. Versioned contract name registry. Provides `publish_latest`, `get_address`, `get_latest` functions. Root of the CDM system.

**reputation** - Generic reputation storage layer. Context owners can submit/delete reviews on behalf of users. Reviews are keyed by `(context_id, reviewer_address, entity_id)`.

**disputes** - Generic disputes system. Context owners can open disputes, provide judgments. Statuses: `Open`, `Resolved`, `Dismissed`.

**entity_graph** - Stores parent-child relationships (edges) between entities. Context owners can add/remove edges with optional metadata.

### Context Architecture

```
┌─────────────────────┐
│ Contract Registry   │  ← CDM bootstrap (deployed first)
│ (registries/contracts)
└─────────────────────┘
         ▲
         │ reference() lookups
    ┌────┴────────────┬──────────┐
    │                 │          │
┌───┴───┐ ┌───────┐ ┌┴────────┐ ┌┴──────┐
│Context│ │ Reptn │ │Disputes │ │ Graph │
│  Reg  │ └───────┘ └─────────┘ └───────┘
└───────┘
```

All system contracts use `contexts::reference()` to verify ownership via cross-contract calls.

### Integration Pattern

External contracts depend on the single `dapps` crate with `ink-as-dependency` feature:

```toml
dapps = { git = "...", default-features = false, features = ["ink-as-dependency"] }
```

**Using runtime references (recommended):**

```rust
use dapps::{ContextId, disputes, entity_graph, registries, reputation};
use dapps::reputation::ReputationRef;

pub fn new(context_id: ContextId) -> Self {
    // Register context ownership
    registries::contexts::reference().register_context(context_id);

    Self {
        reputation: reputation::reference(),
        disputes: disputes::reference(),
        graph: entity_graph::reference(),
        context_id,
    }
}
```

**Available reference functions:**
- `registries::contexts::reference()` → ContextRegistryRef
- `registries::contracts::reference()` → ContractRegistryRef
- `reputation::reference()` → ReputationRef
- `disputes::reference()` → DisputesRef
- `entity_graph::reference()` → EntityGraphRef

**Core types at root level:**
- `dapps::EntityId` - Identifier for any unique entity
- `dapps::ContextId` - Identifier for a context owned by an address
- `dapps::UUID` - 32-byte unique identifier

**Math utilities:**
```rust
use dapps::math::RunningAverage;
```

See `examples/market-api/contract/` for a complete example.

### CDM CLI Tool

Located in `src/packages/cdm-cli/`. TypeScript tool for automated contract building and deployment.

**Commands:**
- `cdm build` - Build all CDM-enabled contracts with registry address
- `cdm deploy <url>` - Deploy and register all contracts in dependency order

**Features:**
- Automatic dependency detection via `::reference()` call analysis
- Topological sorting for correct deployment order
- Dry-run mode (`--dry-run`) to preview deployment plan
- Supports WebSocket URLs and smoldot light client chainspecs
- Configurable signers (default: Alice dev account)

**Options:**
```
cdm build [--contracts <names...>] [--root <path>]
cdm deploy <url> [--signer <name>] [--suri <uri>] [--skip-build] [--dry-run]
```

### TypeScript Client

Uses `polkadot-api` with `@polkadot-api/sdk-ink` for type-safe contract interaction. Contract descriptors are generated via `pnpm papi ink add <contract.contract>`.

## ink! Version

This project uses ink! 6.0.0-beta.1 with the `unstable-hostfn` feature enabled.

## Zombienet Setup

Tests and deployment use a zombienet setup from `../product-preview-net` with:
- **Relay chain**: Westend-local (validators at ports 10000-10002)
- **Asset Hub** (parachain 1000): `ws://127.0.0.1:10020` - main target for contracts
- **Bulletin chain** (parachain 1006): `ws://127.0.0.1:10030`

Contracts use the `revive` pallet on Asset Hub (not ink's standard contracts pallet).

## Deployment Flow

```
1. Deploy ContractRegistry (bootstrap)
              ↓
2. Set CONTRACTS_REGISTRY_ADDR=<address>
              ↓
3. Build all contracts with registry address
   (cdm build)
              ↓
4. Deploy in topological order:
   contexts → reputation → disputes → entity_graph → [your contracts]
              ↓
5. Each contract registers itself via publish_latest()
              ↓
6. Runtime: contracts call module::reference() to resolve addresses
```
