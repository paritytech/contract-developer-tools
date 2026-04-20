# Threads (`@polkadot/threads`)

Generic post-graph contract. A **post** is a content URI published by an **author** under zero or more **parents**. Parents are just `EntityId`s — the contract doesn't care what they represent, so the same primitive serves feeds (parent = topic), replies (parent = another post), and walls (parent = a profile). All writes are gated by context ownership.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context
- `common::generate_id` — derives new post ids from a per-context nonce

## Core Concepts

### Posts

A post carries an author, a list of parent ids, a content URI, and an on-chain timestamp. Parents may be:
- A feed/topic id → the post appears in that feed
- Another post id → the post is a reply
- A profile id → the post is a wall post
- Empty → the post is only reachable via the author index

Duplicate parents in a single `post` call revert (`DuplicateParent`) so the per-parent index can't double-count.

### Indexes

Each post is written into three indexes:

| Index | Keyed by | Purpose |
|-------|----------|---------|
| `info` | `(context_id, post_id)` | The post record itself |
| `parent_at` / `parent_count` | `(context_id, parent, i)` | Every location the post was published to |
| `author_at` / `author_count` | `(context_id, author, i)` | The author's post history |

Counts are monotonic. They index into dense `_at` slots, so `get_*_posts_page` can walk newest-first with simple arithmetic.

### Soft Delete

`delete_post` removes the `info` record but leaves the index slots in place. This keeps offsets stable across deletions — a client paging a feed never has its cursor invalidated. Page getters skip entries whose `info` is absent but still advance `next_offset` past the empty slot, so pagination completes in bounded time.

Access control for deletes is enforced at the app layer before calling the contract — the contract itself only checks context ownership.

## Storage

| Key | Value | Description |
|-----|-------|-------------|
| `ContextId` | `u64` | Per-context nonce used to derive new post ids |
| `(ContextId, EntityId)` | `PostData` | Post record (author, parents, content URI, timestamp) |
| `(ContextId, EntityId)` | `u32` | Count of posts under a given parent |
| `(ContextId, EntityId, u32)` | `EntityId` | Parent's i-th post id |
| `(ContextId, EntityId)` | `u32` | Count of posts by a given author |
| `(ContextId, EntityId, u32)` | `EntityId` | Author's i-th post id |

## Methods

### Writes (Context Owner)

#### `post(context_id, author, parents, content_uri) -> EntityId`
Publishes a post and returns its new id. Indexes the post under each parent and under the author. Zero parents is allowed. Reverts with `DuplicateParent` if `parents` contains the same id twice.

#### `delete_post(context_id, post_id)`
Soft-deletes a post — removes the record, leaves index slots. Reverts with `PostNotFound` if the post doesn't exist.

### Queries (Anyone)

#### `get_post(context_id, post_id) -> Option<Post>`
Returns the full post record, or `None` if deleted / never existed.

#### Parent-scoped index

- `get_parent_count(context_id, parent) -> u32` — total slots under a parent (including deleted)
- `get_parent_at(context_id, parent, index) -> Option<EntityId>` — post id at a specific slot
- `get_parent_posts_page(context_id, parent, offset, limit) -> PostPage` — newest-first batch fetch

#### Author-scoped index

- `get_author_count(context_id, author) -> u32`
- `get_author_at(context_id, author, index) -> Option<EntityId>`
- `get_author_posts_page(context_id, author, offset, limit) -> PostPage`

### Pagination

`PostPage` carries the fetched posts plus a cursor:

```
PostPage {
    posts:       Vec<Post>,  // up to `limit` (capped at MAX_PAGE_LIMIT = 100)
    next_offset: u32,        // pass back as `offset` for the next page
    done:        bool,       // true when the cursor has walked off the end
}
```

Pages are newest-first. `next_offset` advances past deleted slots, so `posts.len()` may be less than `limit` even when `done` is false — keep paging until `done == true`.

## Usage Patterns

- **Topic feed**: pick a stable `EntityId` per topic; post with `parents = [topic_id]`; page via `get_parent_posts_page(context_id, topic_id, ...)`.
- **Replies**: post with `parents = [original_post_id]`; the replies come back from the same parent-scoped index.
- **Wall post**: post with `parents = [profile_id]`.
- **Cross-post**: a single `post` call with multiple parents indexes the post under every one of them.
- **Author timeline**: `get_author_posts_page(context_id, author, ...)` regardless of where the posts were published.
