# Reputation (`@polkadot/reputation`)

Reputation contract. Stores reviews (rating + comment URI) for entities within contexts. All write operations are gated by context ownership — only the context owner can submit or delete reviews.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context

## Storage

| Key | Value |
|-----|-------|
| `(ContextId, Address, EntityId)` | `Review { rating: u8, comment_uri: String }` |

Reviews are keyed by context, reviewer address, and the entity being reviewed — so each reviewer gets one review per entity per context.

## Methods

### `submit_review(context_id, reviewer, entity, rating, comment_uri)`
Creates or overwrites a review. Caller must be the context owner.

### `delete_review(context_id, reviewer, entity)`
Removes a review. Caller must be the context owner.

### `get_rating(context_id, reviewer, entity) -> u8`
Returns the rating for a review, or `0` if not found.
