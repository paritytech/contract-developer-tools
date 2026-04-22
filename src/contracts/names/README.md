# Names (`@polkadot/names`)

Name registry. Maps human-readable `String` names to `Address` owners within a context, with per-owner enumeration, transfers, metadata URIs, and reverse **primary name** lookup. All writes that create or reshape registrations are gated by context ownership; moves between owners are also allowed for the current name owner as a self-service path.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context (for context-scoped writes)

## Core Concepts

### Names

A name is a `String` owned by an `Address` inside a `ContextId`. Two addresses can hold the same name in two different contexts — uniqueness is per-context. Each registered name carries a metadata URI (opaque to the contract; typically points to display text, avatar, verification blob).

Name length caps at `MAX_NAME_LEN = 128` bytes. Empty names are rejected. Metadata URIs cap at `MAX_URI_LEN = 512` bytes. Callers are free to normalize casing/encoding at the app layer, the contract treats names as raw bytes.

### Owner vs. caller

Two roles matter, in the same shape as the other system contracts:

- **Context owner** — the app contract/operator managing a namespace. Authorizes `register_name` and may also perform `transfer_name` / `update_metadata` / `release_name` as a moderation escape hatch.
- **Name owner** — the `Address` the name resolves to. May `transfer_name` / `update_metadata` / `release_name` on names it owns, and is the only role allowed to `set_primary`.

### Primary names (reverse lookup)

Each address may designate **at most one** of its names in a context as its **primary**. `primary_of(context_id, owner)` returns that string, empty if unset. Primary bindings are implicitly cleared on `transfer_name` (the old owner loses the binding) and on `release_name` — there is no stale-primary footgun.

### Per-owner index

Names are indexed per owner via `of_at` / `of_count`, so a client can list everything an address holds in a context. The index uses **swap-and-pop** on release/transfer so slots stay dense and counts stay accurate. Each name stores its own `owner_index` to make O(1) removal possible without scanning.

## Storage

| Key | Value | Description |
|-----|-------|-------------|
| `(ContextId, String)` | `NameData` | Main record (owner, metadata URI, owner index) |
| `(ContextId, Address)` | `u32` | Count of names owned by an address |
| `(ContextId, Address, u32)` | `String` | Owner's i-th name |
| `(ContextId, Address)` | `String` | Reverse primary lookup (empty if unset) |

## Methods

### Writes (Context Owner)

#### `register_name(context_id, name, owner, metadata_uri)`
Claims `name` for `owner` in the given context. Reverts with `NameEmpty`, `NameTooLong`, `UriTooLong`, or `NameTaken` on bad input. Writes the main record, appends to the owner's index, and stamps `owner_index`.

### Writes (Name Owner or Context Owner)

#### `transfer_name(context_id, name, new_owner)`
Moves the name to a new address. Swap-and-pops out of the old owner's list, appends to the new owner's list, updates the main record's owner and `owner_index`. Implicitly clears the old owner's primary if it matched this name.

#### `update_metadata(context_id, name, metadata_uri)`
Replaces the metadata URI. Reverts with `UriTooLong` if too long. Owner and indexes are untouched.

#### `release_name(context_id, name)`
Removes the name from the registry. Swap-and-pops from the owner's list, clears the owner's primary if it matched, drops the main record. The name becomes available again.

### Writes (Name Owner)

#### `set_primary(context_id, name)`
Binds `name` as the caller's primary for this context. Reverts `Unauthorized` if the caller doesn't own the name.

### Writes (Anyone, for self)

#### `clear_primary(context_id)`
Removes the caller's primary binding in this context. No-op if unset.

### Queries (Anyone)

#### `resolve(context_id, name) -> Address`
Cheap forward lookup — returns the owner address of `name`, or the zero address if not registered.

#### `get_name_info(context_id, name) -> Option<Name>`
Full record for a name — id (the name itself), owner, metadata URI.

#### `primary_of(context_id, owner) -> String`
Reverse lookup — the primary name an address has set, or an empty string if none.

#### `is_available(context_id, name) -> bool`
`true` when `name` has no registered owner in this context.

#### `get_name_count(context_id, owner) -> u32`
Number of names an address owns in this context.

#### `get_name_at(context_id, owner, index) -> Option<String>`
Name at a specific slot in the owner's list.

#### `get_names_page(context_id, owner, offset, limit) -> NamePage`
Newest-first batch fetch of names owned by `owner`. `limit` is capped at `MAX_PAGE_LIMIT = 100`.

#### `max_name_len() -> u32`
Returns the hard cap (`128`) so frontends can surface the limit without hardcoding.

### Pagination

`NamePage` carries the fetched names plus a cursor:

```
NamePage {
    names:       Vec<Name>,  // up to `limit` (capped at MAX_PAGE_LIMIT = 100)
    next_offset: u32,        // pass back as `offset` for the next page
    done:        bool,       // true when the cursor has walked off the end
}
```

Pages are newest-first. Since release uses swap-and-pop rather than tombstoning, every slot below `count` is guaranteed populated — `names.len()` will equal `min(limit, count - offset)` until the final page. Still prefer `done == true` as the stop condition to keep the loop identical to the other contracts' pagination.

## Usage Patterns

- **Forward lookup for display**: `resolve(ctx, name)` — gives the owner of a known name.
- **Reverse lookup for UI**: `primary_of(ctx, owner)` — turns a raw address into the owner's preferred human-readable name. If empty, fall back to address truncation.
- **Profile pages / mentions**: combine with `@polkadot/profiles` — use the opt-in `profiles::get_profile_info_with_name(ctx, profile_id)` for a single on-chain call that returns profile + owner's primary, or fetch each side separately (`profiles.get_profile_info` + `names.primary_of`) and join client-side.
- **Moderation**: context owner can `transfer_name`, `update_metadata`, or `release_name` without needing the name owner's cooperation — useful for squatting / policy violations.
- **Namespace migration**: list all of an address's names via `get_names_page`, `transfer_name` each to a new owner, flip `set_primary` on the new address.
