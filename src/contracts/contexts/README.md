# Contexts (`@polkadot/contexts`)

Context registry contract. A **context** is an on-chain namespace identified by a `ContextId` (`[u8; 32]`) with two roles:

- **Owner** — typically an EOA or multisig. Governs the context: rotates ownership, manages operator membership.
- **Operator(s)** — contract addresses authorized to perform writes scoped to this context (e.g. the registry calling `reputation::submit_review`). A context can have any number of operators.

Consumer contracts (reputation, threads, disputes) call `is_owner(ctx, caller())` to gate writes. The check returns true for **either** the owner or any approved operator, so EOAs interacting directly with a consumer and contract operators interacting on behalf of a context both pass.

## Storage

| Key | Value |
|-----|-------|
| `ContextId` | `Address` (owner) |
| `(ContextId, Address)` | `bool` (operator membership) |

## Methods

### `register_context(context_id, owner, operator)`
Registers a new context, setting `owner` as the owner and `operator` as the initial approved operator. No-op if the context already exists — to add operators to an existing context, the owner uses `add_operator`.

### `add_operator(context_id, operator)`
Adds an address to the operator set. Caller must be the current owner. Reverts with `NotOwner` otherwise.

### `remove_operator(context_id, operator)`
Removes an address from the operator set. Caller must be the current owner. Reverts with `NotOwner` otherwise.

### `transfer_owner(context_id, new_owner)`
Rotates the owner. Caller must be the current owner. Reverts with `NotOwner` otherwise. Operator membership is unchanged.

### `get_owner(context_id) -> Address`
Returns the owner address for a context, or the zero address if unregistered.

### `is_authorized(context_id, address) -> bool`
Returns true if `address` is the owner or an approved operator. Preferred entry point for new consumer contracts.

### `is_owner(context_id, address) -> bool`
Back-compat alias for `is_authorized` — same semantics. Existing call sites in reputation, threads, and disputes use this name; new consumers should prefer `is_authorized`.

## Consumer migration recipe

For an operator contract (e.g. a registry) being redeployed under the same `context_id`:

1. **Owner**: `add_operator(ctx, new_operator_address)`.
2. Deploy the new operator contract.
3. (Optional) Freeze and replay state on the outgoing operator.
4. **Owner**: `remove_operator(ctx, old_operator_address)` once the cutover is complete.

No contract-side hatch on the outgoing operator is required — context-level authority is managed entirely through `contexts` by the owner.

## CDM

This is the base contract — `reputation`, `threads`, and `disputes` all depend on it via `contexts::cdm_reference()` to verify context-level authorization before performing writes.
