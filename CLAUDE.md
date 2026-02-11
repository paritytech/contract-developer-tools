## Workflow Rules

- **Always act as team leader.** The primary agent the user is talking to MUST act as a team leader and delegate work to sub-agents for almost everything.
- **Always use team mode.** You MUST always run agents in team mode (using `TeamCreate` + `Task` with `team_name`) so the user can properly watch their work. Never use standalone agents outside of a team. This applies to ALL agent usage — no exceptions.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rust smart contract workspace for Polkadot/Substrate chains targeting PolkaVM (RISC-V). It uses `cargo-pvm-contract` for contract compilation and provides reusable on-chain systems (contracts) and shared utilities via the `dapps` crate, with TypeScript tooling for chain interaction and deployment.

The project uses the **CDM (Contract Deployment Manager)** system for automated contract deployment and runtime contract linking.

## Commands

**Build all contracts**: `bash scripts/build.sh` or `cargo pvm-contract build -p <name>` per contract

**Check contracts**: `cargo check`

**Build a single contract**: `cargo pvm-contract build --manifest-path Cargo.toml -p <contract_name>`

**Deploy with CDM CLI** (from `src/packages/cdm-cli/`):

```sh
# Build all contracts (requires registry address)
CONTRACTS_REGISTRY_ADDR=0x... bun run dev build

# Deploy to local node
CONTRACTS_REGISTRY_ADDR=0x... bun run dev deploy ws://localhost:9944

# Dry-run to see deployment plan
CONTRACTS_REGISTRY_ADDR=0x... bun run dev deploy --dry-run ws://localhost:9944
```

**Integration tests** (requires zombienet running):

```sh
# 1. Start zombienet (from product-preview-net repo)
zombie-cli spawn -p native bin/local-dev.toml

# 2. Deploy contracts
cd scripts/deploy-ts && bun src/deploy.ts

# 3. Run integration test
CONTRACTS_REGISTRY_ADDR=<deployed-addr> bun src/integration-test.ts
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
│   ├── lib.rs               # Core types (EntityId, ContextId, UUID) + allocator
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
└── system-basic/            # Simple item tracker example
```

### Build System

Contracts target `riscv64emac-unknown-none-polkavm` (custom PolkaVM target). Building is done via the external `cargo pvm-contract build` CLI (like `cargo contract build` was for ink!):
- No build.rs or `[build-dependencies]` needed in contract crates
- Both `[lib]` and `[[bin]]` targets pointing to `lib.rs` (lib for dependency use, bin for PolkaVM binary)
- `cargo pvm-contract build -p <name>` handles: compile → ELF → PolkaVM linking → ABI extraction
- Output in `target/`: `<name>.release.polkavm`, `<name>.release.abi.json`

### CDM (Contract Deployment Manager)

CDM enables dynamic contract address resolution at runtime, eliminating hardcoded addresses.

**How it works:**

1. **ContractRegistry** is deployed first (bootstrap - no CDM attribute)
2. Set `CONTRACTS_REGISTRY_ADDR` env var with the deployed address
3. Rebuild all other contracts with the registry address baked in
4. Deploy contracts in dependency order; each registers itself in the registry
5. At runtime, contracts call `module::cdm_reference()` to look up addresses

**The `cdm` attribute on `#[pvm::contract]`:**

```rust
#[pvm::contract(cdm = "@polkadot/reputation")]
mod reputation {
    // ...
}

// Generates:
// - `pub struct Reference { addr: Address }` with proxy methods
// - `pub fn reference(addr: Address) -> Reference`
// - `pub fn cdm_reference() -> Reference` (looks up address from ContractRegistry at runtime)
```

### Contract Anatomy (pvm pattern)

```rust
#![no_main]
#![no_std]

use dapps_core as _;                    // Forces allocator linking
use pvm_contract as pvm;               // Convention: alias as pvm
use pvm::{Address, caller};
use pvm::storage::Mapping;
use alloc::string::String;             // #[pvm::contract] injects `extern crate alloc`

#[pvm::storage]
struct Storage {
    my_map: Mapping<Key, Value>,        // Key-value storage
    my_field: SomeType,                 // Single-value storage (Lazy)
}

#[pvm::contract(cdm = "@polkadot/my_contract")]
mod my_contract {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {  // Error is auto-generated (empty enum)
        Ok(())
    }

    #[pvm::method]
    pub fn my_method(param: u32) -> u32 {
        // Method body
        42
    }
}
```

**Key constraints:**
- `#[pvm::contract]` generates an empty `pub enum Error {}` - custom variants are NOT supported
- Method params and return types must implement `SolAbi` (primitives, `String`, `Address`, `[u8; N]`, `bool`)
- Custom structs as params/returns need `#[derive(pvm::SolAbi)]` or flatten to primitive params
- Internal storage types (Mapping values) only need `Encode + Decode` from parity-scale-codec
- Reference proxy methods return `CallResult<T>` (i.e., `Result<T, CallError>`)
- Every contract crate must link `dapps_core` (contains the global allocator): `use dapps_core as _;`

### System Contracts

**registries/contexts** (ContextRegistry) - Shared context ownership registry. Contexts are owned by addresses (typically contracts). Provides `register_context`, `get_owner`, and `is_owner` functions.

**registries/contracts** (ContractRegistry) - CDM bootstrap contract. Versioned contract name registry. Provides `publish_latest`, `get_address`, `get_metadata_uri`, `get_contract_count` functions. Root of the CDM system.

**reputation** - Generic reputation storage layer. Context owners can submit/delete reviews on behalf of users. Reviews are keyed by `(context_id, reviewer_address, entity_id)`.

**disputes** - Generic disputes system. Context owners can open disputes, provide judgments. Status codes: `0` = Open, `1` = Resolved, `2` = Dismissed.

**entity_graph** - Stores parent-child relationships (edges) between entities. Context owners can add/remove edges with optional metadata.

### Context Architecture

```
┌─────────────────────┐
│ Contract Registry   │  <- CDM bootstrap (deployed first)
│ (registries/contracts)
└─────────────────────┘
         ^
         | cdm_reference() lookups
    ┌────┴────────────┬──────────┐
    |                 |          |
┌───┴───┐ ┌───────┐ ┌┴────────┐ ┌┴──────┐
│Context│ │ Reptn │ │Disputes │ │ Graph │
│  Reg  │ └───────┘ └─────────┘ └───────┘
└───────┘
```

All system contracts use `contexts::cdm_reference()` to verify ownership via cross-contract calls.

### Integration Pattern

External contracts depend on the `dapps` crate:

```toml
[dependencies]
pvm_contract = { workspace = true }
polkavm-derive = { workspace = true }
parity-scale-codec = { workspace = true }
dapps = { path = "../../../src", default-features = false }
dapps_core = { path = "../../../src/core" }
```

**Using CDM references (recommended):**

```rust
use dapps::{ContextId, EntityId};

#[pvm::constructor]
pub fn new(context_id: ContextId) -> Result<(), Error> {
    // Register context ownership
    let ctx_reg = dapps::registries::contexts::cdm_reference();
    ctx_reg.register_context(context_id).expect("registration failed");
    Ok(())
}

#[pvm::method]
pub fn do_something(entity: EntityId) {
    let rep = dapps::reputation::cdm_reference();
    rep.submit_review(context_id, caller(), entity, 5, "ipfs://...".into())
        .expect("call failed");
}
```

**Available CDM reference functions:**

- `dapps::registries::contexts::cdm_reference()` -> contexts::Reference
- `dapps::registries::contracts::cdm_reference()` -> contracts::Reference
- `dapps::reputation::cdm_reference()` -> reputation::Reference
- `dapps::disputes::cdm_reference()` -> disputes::Reference
- `dapps::entity_graph::cdm_reference()` -> entity_graph::Reference

**Core types at root level:**

- `dapps::EntityId` - `[u8; 32]` identifier for any unique entity
- `dapps::ContextId` - `[u8; 32]` identifier for a context owned by an address
- `dapps::UUID` - `[u8; 32]` unique identifier

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

- Automatic dependency detection via `::cdm_reference()` call analysis
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

Uses `polkadot-api` for type-safe contract interaction. Contract descriptors are generated via `npx papi sol add <contract.abi.json> <name>` (Solidity ABI format).

## Contract Framework

This project uses `cargo-pvm-contract` targeting PolkaVM (RISC-V). Key dependencies:

- `pvm_contract` - Contract runtime (storage, ABI, host functions)
- `cargo-pvm-contract` - CLI build tool (`cargo pvm-contract build`)
- `parity-scale-codec` - Encoding for storage types
- `picoalloc` - Global allocator for no_std (in dapps_core)

**Toolchain:** Rust nightly (required for `-Zbuild-std`)

**Target:** `riscv64emac-unknown-none-polkavm` (custom target spec in workspace root)

## Zombienet Setup

Tests and deployment use a zombienet setup from `../product-preview-net` with:

- **Relay chain**: Westend-local (validators at ports 10000-10002)
- **Asset Hub** (parachain 1000): `ws://127.0.0.1:10020` - main target for contracts
- **Bulletin chain** (parachain 1006): `ws://127.0.0.1:10030`

Contracts use the `revive` pallet on Asset Hub.

## Deployment Flow

```
1. Deploy ContractRegistry (bootstrap)
              |
2. Set CONTRACTS_REGISTRY_ADDR=<address>
              |
3. Build all contracts with registry address
   (cargo pvm-contract build or cdm build)
              |
4. Deploy in topological order:
   contexts -> reputation -> disputes -> entity_graph -> [your contracts]
              |
5. Each contract registers itself via publish_latest()
              |
6. Runtime: contracts call module::cdm_reference() to resolve addresses
```
