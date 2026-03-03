# Contexts (`@polkadot/contexts`)

Context registry contract. A **context** is an on-chain namespace identified by a `ContextId` (`[u8; 32]`) and owned by a single address. Other system contracts (reputation, disputes) use contexts for access control — only the context owner can write data scoped to that context.

## Storage

| Key | Value |
|-----|-------|
| `ContextId` | `Address` (owner) |

## Methods

### `register_context(context_id)`
Registers a new context with the caller as owner. No-ops if the context already exists.

### `get_owner(context_id) -> Address`
Returns the owner address for a context, or the zero address if unregistered.

### `is_owner(context_id, address) -> bool`
Returns whether the given address owns the context.

## CDM

This is the base contract — `reputation` and `disputes` both depend on it via `contexts::cdm_reference()` to verify context ownership before performing writes.
