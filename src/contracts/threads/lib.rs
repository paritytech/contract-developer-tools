#![no_main]
#![no_std]

// Note: no `use alloc::vec::Vec;` at outer scope — `#[pvm::contract]` emits
// its own and the two collide (E0252). Outer-scope struct fields that need
// Vec use the fully-qualified `alloc::vec::Vec<T>`; the module below imports
// Vec locally where it builds / returns lists.
use alloc::string::String;
use common::{ContextId, EntityId};
use parity_scale_codec::{Decode, Encode};
use pvm::storage::Mapping;
use pvm_contract as pvm;

const MAX_PAGE_LIMIT: u32 = 100;

/// On-chain post record (SCALE-encoded in storage). `parents` carries every
/// location the post was published to — top-level feeds, other posts (replies),
/// and/or profiles (wall posts). A post may have zero parents, in which case
/// it is only reachable via the author index.
#[derive(Default, Clone, Encode, Decode)]
pub struct PostData {
    pub author: EntityId,
    pub parents: alloc::vec::Vec<EntityId>,
    pub content_uri: String,
    pub timestamp: u64,
}

/// ABI-facing view of a post. Carries its id so a single call fully
/// describes the record for the client.
#[derive(Default, pvm::SolAbi)]
pub struct Post {
    pub post_id: EntityId,
    pub author: EntityId,
    pub parents: alloc::vec::Vec<EntityId>,
    pub content_uri: String,
    pub timestamp: u64,
}

/// Paginated response. `next_offset` advances over deleted entries so the
/// client never loops; `done` flips true when the cursor has walked off the
/// end of the index being scanned.
#[derive(Default, pvm::SolAbi)]
pub struct PostPage {
    pub posts: alloc::vec::Vec<Post>,
    pub next_offset: u32,
    pub done: bool,
}

#[pvm::storage]
struct Storage {
    /// Cached reference to `@polkadot/contexts` for owner-gating.
    context_registry: contexts::Reference,

    /// Per-context monotonic nonce used to generate new post ids.
    post_count: Mapping<ContextId, u64>,

    /// Count of posts indexed under a given parent.
    parent_count: Mapping<(ContextId, EntityId), u32>,

    /// Parent's i-th post id.
    parent_at: Mapping<(ContextId, EntityId, u32), EntityId>,

    /// Count of posts an author has made.
    author_count: Mapping<(ContextId, EntityId), u32>,

    /// Author's i-th post id.
    author_at: Mapping<(ContextId, EntityId, u32), EntityId>,

    /// Post record, keyed by id.
    info: Mapping<(ContextId, EntityId), PostData>,
}

fn post_from(post_id: EntityId, data: PostData) -> Post {
    Post {
        post_id,
        author: data.author,
        parents: data.parents,
        content_uri: data.content_uri,
        timestamp: data.timestamp,
    }
}

/// Returns true if `haystack[..upto]` contains `needle`.
/// Used to reject duplicate parents in the input to `post`.
fn contains_before(haystack: &[EntityId], upto: usize, needle: &EntityId) -> bool {
    let mut i = 0;
    while i < upto {
        if &haystack[i] == needle {
            return true;
        }
        i += 1;
    }
    false
}

#[pvm::contract(cdm = "@polkadot/threads")]
mod threads {
    use super::{
        contains_before, post_from, pvm, ContextId, EntityId, Post, PostData, PostPage,
        Storage, String, MAX_PAGE_LIMIT,
    };
    use alloc::vec::Vec;
    use common::{generate_id, revert};
    use pvm::caller;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        Storage::context_registry().set(&contexts::cdm_reference());
        Ok(())
    }

    /// Revert unless the caller is the owner of `context_id`.
    fn ensure_context_owner(context_id: ContextId) {
        let ctx_reg = match Storage::context_registry().get() {
            Some(r) => r,
            None => revert(b"NotInitialized"),
        };
        let is_owner = match ctx_reg.is_owner(context_id, caller()) {
            Ok(v) => v,
            Err(_) => revert(b"ContextsCallFailed"),
        };
        if !is_owner {
            revert(b"Unauthorized");
        }
    }

    /// Publish `content_uri` as `author` under each id in `parents`. Returns
    /// the new post id. Identical parent ids in the input revert (keeps the
    /// per-parent index unambiguous). Zero parents is allowed — the post is
    /// then only reachable via the author index.
    #[pvm::method]
    pub fn post(
        context_id: ContextId,
        author: EntityId,
        parents: Vec<EntityId>,
        content_uri: String,
    ) -> EntityId {
        ensure_context_owner(context_id);

        // Reject dupes in-place so the per-parent index can't double-count.
        let mut i = 0;
        while i < parents.len() {
            if contains_before(&parents, i, &parents[i]) {
                revert(b"DuplicateParent");
            }
            i += 1;
        }

        let nonce = Storage::post_count().get(&context_id).unwrap_or(0);
        let post_id: EntityId = generate_id(nonce);
        Storage::post_count().insert(&context_id, &(nonce + 1));

        // Timestamp — first 8 bytes of the 32-byte LE `now` buffer are the
        // Unix seconds.
        let mut buf = [0u8; 32];
        pvm::api::now(&mut buf);
        let timestamp = u64::from_le_bytes(buf[0..8].try_into().unwrap_or([0u8; 8]));

        // Index under every parent.
        let mut j = 0;
        while j < parents.len() {
            let parent = parents[j];
            let pc = Storage::parent_count()
                .get(&(context_id, parent))
                .unwrap_or(0);
            Storage::parent_at().insert(&(context_id, parent, pc), &post_id);
            Storage::parent_count().insert(&(context_id, parent), &(pc + 1));
            j += 1;
        }

        // Index under the author.
        let ac = Storage::author_count()
            .get(&(context_id, author))
            .unwrap_or(0);
        Storage::author_at().insert(&(context_id, author, ac), &post_id);
        Storage::author_count().insert(&(context_id, author), &(ac + 1));

        Storage::info().insert(
            &(context_id, post_id),
            &PostData {
                author,
                parents,
                content_uri,
                timestamp,
            },
        );

        post_id
    }

    /// Soft-delete a post: the record is removed but index slots remain so
    /// offsets stay stable. Page getters skip entries whose `info` is absent.
    /// App layer enforces "is the caller allowed to delete?" before calling.
    #[pvm::method]
    pub fn delete_post(context_id: ContextId, post_id: EntityId) {
        ensure_context_owner(context_id);
        if !Storage::info().contains(&(context_id, post_id)) {
            revert(b"PostNotFound");
        }
        Storage::info().remove(&(context_id, post_id));
    }

    // --- Queries (open) ---

    #[pvm::method]
    pub fn get_post(context_id: ContextId, post_id: EntityId) -> Option<Post> {
        Storage::info()
            .get(&(context_id, post_id))
            .map(|d| post_from(post_id, d))
    }

    // --- Parent-scoped index (feed / replies / wall) ---

    #[pvm::method]
    pub fn get_parent_count(context_id: ContextId, parent: EntityId) -> u32 {
        Storage::parent_count()
            .get(&(context_id, parent))
            .unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_parent_at(
        context_id: ContextId,
        parent: EntityId,
        index: u32,
    ) -> Option<EntityId> {
        Storage::parent_at().get(&(context_id, parent, index))
    }

    /// Batch-fetch posts under `parent`, newest-first. Deleted posts are
    /// skipped but `next_offset` still advances past their slots.
    #[pvm::method]
    pub fn get_parent_posts_page(
        context_id: ContextId,
        parent: EntityId,
        offset: u32,
        limit: u32,
    ) -> PostPage {
        let total = Storage::parent_count()
            .get(&(context_id, parent))
            .unwrap_or(0);
        let cap = if limit > MAX_PAGE_LIMIT { MAX_PAGE_LIMIT } else { limit };

        if offset >= total || cap == 0 {
            return PostPage {
                posts: Vec::new(),
                next_offset: total,
                done: true,
            };
        }

        let mut posts: Vec<Post> = Vec::with_capacity(cap as usize);
        let mut scanned: u32 = 0;

        while posts.len() < cap as usize && offset + scanned < total {
            let idx = total - 1 - offset - scanned;
            scanned += 1;
            if let Some(post_id) = Storage::parent_at().get(&(context_id, parent, idx)) {
                if let Some(data) = Storage::info().get(&(context_id, post_id)) {
                    posts.push(post_from(post_id, data));
                }
            }
        }

        let next_offset = offset + scanned;
        let done = next_offset >= total;
        PostPage {
            posts,
            next_offset,
            done,
        }
    }

    // --- Author-scoped index ---

    #[pvm::method]
    pub fn get_author_count(context_id: ContextId, author: EntityId) -> u32 {
        Storage::author_count()
            .get(&(context_id, author))
            .unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_author_at(
        context_id: ContextId,
        author: EntityId,
        index: u32,
    ) -> Option<EntityId> {
        Storage::author_at().get(&(context_id, author, index))
    }

    /// Batch-fetch posts by `author`, newest-first.
    #[pvm::method]
    pub fn get_author_posts_page(
        context_id: ContextId,
        author: EntityId,
        offset: u32,
        limit: u32,
    ) -> PostPage {
        let total = Storage::author_count()
            .get(&(context_id, author))
            .unwrap_or(0);
        let cap = if limit > MAX_PAGE_LIMIT { MAX_PAGE_LIMIT } else { limit };

        if offset >= total || cap == 0 {
            return PostPage {
                posts: Vec::new(),
                next_offset: total,
                done: true,
            };
        }

        let mut posts: Vec<Post> = Vec::with_capacity(cap as usize);
        let mut scanned: u32 = 0;

        while posts.len() < cap as usize && offset + scanned < total {
            let idx = total - 1 - offset - scanned;
            scanned += 1;
            if let Some(post_id) = Storage::author_at().get(&(context_id, author, idx)) {
                if let Some(data) = Storage::info().get(&(context_id, post_id)) {
                    posts.push(post_from(post_id, data));
                }
            }
        }

        let next_offset = offset + scanned;
        let done = next_offset >= total;
        PostPage {
            posts,
            next_offset,
            done,
        }
    }

    #[pvm::fallback]
    pub fn fallback() -> Result<(), Error> {
        revert(b"UnknownSelector");
    }
}
