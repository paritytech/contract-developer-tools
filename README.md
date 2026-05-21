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

### `profiles` (`@polkadot/profiles`)
Profile registry - maps addresses to one-to-many profile `EntityId`s with metadata, scoped by context. Depends on `contexts` for ownership, and opt-in on `names` for `get_profile_info_with_name` (returns profile + owner's primary name in one call).

### `threads` (`@polkadot/threads`)
Thread/relationship graph — indexes posts by parent and author, forming a generic graph usable as feeds, replies, or walls. Depends on `contexts` for ownership verification.

### `names` (`@polkadot/names`)
Name registry - maps human-readable names to addresses within a context, with metadata URIs, per-owner enumeration, transfers, and reverse primary lookup. Depends on `contexts` for ownership verification.

```
reputation   disputes   threads   names
      \        |          |        |
       \       |          |        |
        \     [context ownership]  |
         \     |          |        |
          +--> contexts <-+--------+
                  ^
                  |
               profiles --also--> names (opt-in, for primary_name)
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
      profiles/                        # Profile registry (depends on contexts, opt-in names)
        Cargo.toml
        lib.rs
      threads/                         # Thread/relationship graph (depends on contexts)
        Cargo.toml
        lib.rs
      names/                           # Name registry (depends on contexts)
        Cargo.toml
        lib.rs
    index.ts                           # TypeScript validation script
```
