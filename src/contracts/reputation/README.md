# Reputation (`@polkadot/reputation`)

Reputation contract. Stores reviews (rating + comment URI) for entities within contexts. All write operations are gated by context ownership — only the context owner can submit or delete reviews. Each address can leave one review per entity per context; submitting again updates the existing review in-place.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context

## Storage

| Key | Value |
|-----|-------|
| `(ContextId, EntityId, u64)` | `Review { reviewer, rating, comment_uri }` |
| `(ContextId, EntityId)` | `RunningAverage` (tracks average rating + count) |
| `(ContextId, Address, EntityId)` | `u64` (reverse index — maps reviewer to their review's position) |

Reviews are indexed by `(context_id, entity_id, index)` for efficient paging. The reverse index (`address_review_index`) enforces one review per address and allows O(1) lookups/deletes by reviewer.

## Methods

### `submit_review(context_id, reviewer, entity, rating, comment_uri)`
Creates or updates a review. If the reviewer already has a review for this entity, the existing review is updated in-place and the running average is adjusted. Caller must be the context owner.

### `delete_review(context_id, reviewer, entity)`
Removes a review. Uses swap-and-pop internally — the last review in the index fills the deleted slot, so indices stay dense. Caller must be the context owner.

### `get_review_at(context_id, entity, index) -> Review`
Returns the review at the given index for an entity. Returns a default (zero) review if the index is out of range. Use `get_metrics` to get the total count for paging.

### `get_rating(context_id, reviewer, entity) -> u8`
Returns the rating for a specific reviewer, or `0` if not found.

### `get_metrics(context_id, entity) -> Metrics { average, count }`
Returns the average rating (`u8`) and total review count (`u64`) for an entity.

## Paging Example

To iterate all reviews for an entity:

1. Call `get_metrics(context_id, entity)` to get the `count`
2. Loop `index` from `0` to `count - 1`, calling `get_review_at(context_id, entity, index)` for each
