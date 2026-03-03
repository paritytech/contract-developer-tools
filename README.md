# Contract Developer Tools

A suite of common on-chain system contracts for the Polkadot contract ecosystem, built with [cargo-pvm-contract](https://github.com/nicetomeetyou-github/cargo-pvm-contract) and managed with [CDM](https://github.com/nicetomeetyou-github/contract-dependency-manager) (Contract Dependency Manager).

#### Prerequisites

- [Rust nightly](https://rustup.rs/)
- [bun](https://bun.sh/): `curl -fsSL https://bun.sh/install | bash`
- [cdm cli](https://github.com/nicetomeetyou-github/contract-dependency-manager)

## Contracts

### `contexts` (`@polkadot/contexts`)
Context registry — registers and manages context ownership. A context is an on-chain namespace owned by an address, used by other contracts for access control.

### `reputation` (`@polkadot/reputation`)
Reputation system — manages reviews and ratings for entities within contexts. Depends on `contexts` via CDM for ownership verification.

### `disputes` (`@polkadot/disputes`)
Dispute system — manages the lifecycle of disputes (open, judge, resolve/dismiss) within contexts. Depends on `contexts` via CDM for ownership verification.

```
reputation --depends on--> contexts <--depends on-- disputes
                              |
                       [context ownership]
                    ContextId -> Address
```

## Shared Types (`src/lib`)

Common types used across contracts:
- `UUID` — 32-byte identifier (`[u8; 32]`)
- `EntityId` — identifier for any unique entity in the system
- `ContextId` — identifier for a context owned & controlled by an address

## Usage

**Build**
```bash
cdm build
```

**Deploy**
```bash
cdm deploy --bootstrap ws://localhost:9944
```

**Validate** (TypeScript)
```bash
bun install
bun run start
```

## Directory Structure

```
contract-developer-tools/
  Cargo.toml                          # Workspace root
  cdm.json                            # CDM deployment config
  package.json                        # TypeScript dependencies
  src/
    lib/                               # Shared types library (crate: common)
      Cargo.toml
      lib.rs
    contracts/
      contexts/                        # Context registry (base contract)
        Cargo.toml
        lib.rs
      reputation/                      # Reputation system (depends on contexts)
        Cargo.toml
        lib.rs
      disputes/                        # Dispute system (depends on contexts)
        Cargo.toml
        lib.rs
    index.ts                           # TypeScript validation script
```
