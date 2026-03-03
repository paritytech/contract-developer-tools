# Disputes (`@polkadot/disputes`)

Disputes contract. Manages the lifecycle of disputes within contexts. A dispute is filed by a claimant against an entity, and can be resolved or dismissed by the context owner.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context

## Storage

| Key | Value |
|-----|-------|
| `(ContextId, EntityId)` | `Dispute { id, claimant, against, claim_uri, status, resolution_uri }` |

## Status Codes

| Code | Meaning |
|------|---------|
| `0` | Open |
| `1` | Resolved |
| `2` | Dismissed |
| `255` | Not found (returned by `get_dispute_status`) |

## Methods

### `open_dispute(context_id, dispute_id, claimant, against, claim_uri)`
Opens a new dispute. Caller must be the context owner. No-ops if a dispute with that ID already exists in the context.

### `provide_judgment(context_id, dispute_id, status, resolution_uri)`
Judges an open dispute — sets status to resolved (`1`) or dismissed (`2`). Only open disputes can be judged. Caller must be the context owner.

### `delete_dispute(context_id, dispute_id)`
Removes a dismissed dispute from storage. Only dismissed disputes can be deleted. Caller must be the context owner.

### `get_dispute_status(context_id, dispute_id) -> u8`
Returns the status code for a dispute, or `255` if not found.
