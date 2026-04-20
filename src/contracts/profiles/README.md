# Profiles (`@polkadot/profiles`)

Profile registry. Mints profile ids that belong to an `Address` and carry a metadata URI. One address can own many profiles within a context — each `create_profile` call mints a fresh id, so the same user can hold multiple personas (or roles, or accounts) under the same app. All writes are gated by context ownership.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context
- `common::generate_id` — derives new profile ids from a per-context nonce

## Core Concepts

### Profile

A profile is a `(owner, metadata_uri)` record keyed by an `EntityId`. The id is the stable handle that other contracts reference (e.g., `@polkadot/threads` can use a profile id as a parent for wall posts). `metadata_uri` is opaque to the contract — typically an off-chain pointer to display name, avatar, etc.

### Owner vs. caller

The contract distinguishes two roles:

- **Context owner** (the caller) — the app contract/operator creating or mutating profiles. Gated via `@polkadot/contexts`.
- **Profile owner** (the `Address` recorded on the profile) — the end user the profile represents.

Whether the profile owner actually authorized a given `update_profile` is the **app layer's** job to verify before calling. This contract only enforces the context-owner gate — it has no built-in signature check against the profile's recorded `owner`.

### Per-owner index

Profiles are indexed per owner via `of_at` / `of_count`, so a client can list everything an address holds in a context without scanning the full registry. The index is append-only; there's no `delete_profile` today.

## Storage

| Key | Value | Description |
|-----|-------|-------------|
| `ContextId` | `u64` | Per-context nonce used to derive new profile ids |
| `(ContextId, EntityId)` | `ProfileData` | Profile record (owner, metadata URI) |
| `(ContextId, Address)` | `u32` | Count of profiles owned by an address |
| `(ContextId, Address, u32)` | `EntityId` | Owner's i-th profile id |

## Methods

### Writes (Context Owner)

#### `create_profile(context_id, owner, metadata_uri) -> EntityId`
Mints a new profile id, records it under `owner`, and appends to the owner's profile list. `metadata_uri` may be empty. Returns the new id.

#### `update_profile(context_id, profile_id, metadata_uri)`
Replaces the metadata URI of an existing profile. Reverts with `ProfileNotFound` if the id doesn't exist. The recorded `owner` cannot be changed.

### Queries (Anyone)

#### `get_profile_info(context_id, profile_id) -> Option<Profile>`
Returns the full profile record, or `None` if not found.

#### `get_profile_owner(context_id, profile_id) -> Address`
Cheap owner-only lookup — skips the metadata round-trip. Returns zero address if not found. Use this when authenticating a profile id rather than displaying it.

#### `get_profile_count(context_id, owner) -> u32`
Number of profiles the address owns in this context.

#### `get_profile_at(context_id, owner, index) -> Option<EntityId>`
Profile id at a specific slot in the owner's list.

#### `get_profiles_page(context_id, owner, offset, limit) -> ProfilePage`
Newest-first batch fetch of profiles owned by `owner`. `limit` is capped at `MAX_PAGE_LIMIT = 100`.

### Pagination

`ProfilePage` carries the fetched profiles plus a cursor:

```
ProfilePage {
    profiles:    Vec<Profile>,  // up to `limit` (capped at MAX_PAGE_LIMIT = 100)
    next_offset: u32,           // pass back as `offset` for the next page
    done:        bool,          // true when the cursor has walked off the end
}
```

Pages are newest-first. The scan skips empty slots (reserved for future deletes) while still advancing `next_offset`, so keep paging until `done == true` rather than relying on `profiles.len() == limit`.

## Usage Patterns

- **One-to-one identity**: app calls `create_profile` on first login; stores the returned id alongside the user.
- **Multiple personas**: call `create_profile` again for the same `owner` — each call mints a new id.
- **List a user's profiles**: `get_profiles_page(context_id, owner, 0, N)`, then keep paging until `done`.
- **Cross-contract reference**: pass the profile id to other contracts (e.g., as a `parent` in `@polkadot/threads`) to attach activity to a profile rather than raw addresses.
