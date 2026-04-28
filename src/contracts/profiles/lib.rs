#![no_main]
#![no_std]

// Note: no `use alloc::vec::Vec;` at outer scope — `#[pvm::contract]` emits
// its own for the generated dispatch code and the two collide (E0252).
// `ProfilePage.profiles` uses the fully-qualified `alloc::vec::Vec<Profile>`
// at outer scope; the module below imports Vec locally where it's used.
use alloc::string::String;
use common::indexing::OrderedIndex;
use common::{ContextId, EntityId};
use parity_scale_codec::{Decode, Encode};
use pvm::storage::Mapping;
use pvm::Address;
use pvm_contract as pvm;

const MAX_PAGE_LIMIT: u32 = 100;

/// Cap on `username` byte length, sized so a fully-packed (T=2, 3-entry)
/// internal node of `USERNAME_INDEX` stays inside `pallet-revive`'s 416-byte
/// storage value cap.
const MAX_USERNAME_LEN: usize = 32;

/// On-chain profile record (SCALE-encoded in storage).
#[derive(Default, Clone, Encode, Decode)]
pub struct ProfileData {
    pub owner: Address,
    pub username: String,
    pub metadata_uri: String,
    /// Insertion nonce returned by `USERNAME_INDEX.insert`. Stored so that
    /// `rename_profile` can do an O(log n) `remove_by_nonce` instead of a
    /// duplicate scan.
    pub username_nonce: u64,
}

/// ABI-facing view of a profile.
#[derive(Default, pvm::SolAbi)]
pub struct Profile {
    pub profile_id: EntityId,
    pub owner: Address,
    pub username: String,
    pub metadata_uri: String,
}

/// Paginated response. `next_offset` is the offset to pass on the next call
/// to continue where this page left off; `done` flips true when the cursor
/// walks off the end.
#[derive(Default, pvm::SolAbi)]
pub struct ProfilePage {
    pub profiles: alloc::vec::Vec<Profile>,
    pub next_offset: u32,
    pub done: bool,
}

#[pvm::storage]
struct Storage {
    /// Cached reference to `@polkadot/contexts` for owner-gating.
    context_registry: contexts::Reference,

    /// Per-context monotonic nonce used to generate new profile ids.
    profile_count: Mapping<ContextId, u64>,

    /// Address → how many profiles it owns (within a given context).
    of_count: Mapping<(ContextId, Address), u32>,

    /// Address's i-th profile id (per-owner index).
    of_at: Mapping<(ContextId, Address, u32), EntityId>,

    /// Profile record, keyed by id.
    info: Mapping<(ContextId, EntityId), ProfileData>,
}

/// Sorted multimap from `(ContextId, username)` to `profile_id`. The composite
/// key partitions by context (tuple `Ord` is lexicographic) so a prefix search
/// is one bounded `range` that can never bleed across contexts.
const USERNAME_INDEX: OrderedIndex<(ContextId, String), EntityId, 2> =
    OrderedIndex::new(b"profiles::username_index");

fn profile_from(profile_id: EntityId, data: ProfileData) -> Profile {
    Profile {
        profile_id,
        owner: data.owner,
        username: data.username,
        metadata_uri: data.metadata_uri,
    }
}

/// Smallest `(ctx, key)` pair strictly greater than every `(ctx, prefix*)`
/// entry. Bumps the rightmost incrementable byte of the prefix; if none
/// exists (empty prefix or all-0xFF), bumps the context instead. Returns
/// `None` only when both saturate — vanishingly unlikely for random
/// 32-byte ContextIds.
fn upper_bound(ctx: ContextId, prefix: &str) -> Option<(ContextId, String)> {
    let mut bytes = prefix.as_bytes().to_vec();
    while bytes.last() == Some(&0xFF) {
        bytes.pop();
    }
    if let Some(b) = bytes.last_mut() {
        *b += 1;
        return Some((ctx, String::from_utf8_lossy(&bytes).into_owned()));
    }
    let mut next = ctx;
    for i in (0..32).rev() {
        if next[i] < 0xFF {
            next[i] += 1;
            for j in (i + 1)..32 {
                next[j] = 0;
            }
            return Some((next, String::new()));
        }
    }
    None
}

#[pvm::contract(cdm = "@polkadot/profiles")]
mod profiles {
    use super::{
        pvm, profile_from, upper_bound, Address, ContextId, EntityId, Profile, ProfileData,
        ProfilePage, Storage, String, MAX_PAGE_LIMIT, MAX_USERNAME_LEN, USERNAME_INDEX,
    };
    use alloc::vec::Vec;
    use common::{generate_id, revert};
    use core::ops::Bound;
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

    fn validate_username(username: &str) {
        if username.is_empty() || username.len() > MAX_USERNAME_LEN {
            revert(b"InvalidUsername");
        }
    }

    /// Create a new profile for `owner`. `username` must be non-empty,
    /// at most `MAX_USERNAME_LEN` bytes, and unique within `context_id`.
    #[pvm::method]
    pub fn create_profile(
        context_id: ContextId,
        owner: Address,
        username: String,
        metadata_uri: String,
    ) -> EntityId {
        ensure_context_owner(context_id);
        validate_username(username.as_str());

        let key = (context_id, username.clone());
        if USERNAME_INDEX.contains_key(&key) {
            revert(b"UsernameTaken");
        }

        let nonce = Storage::profile_count().get(&context_id).unwrap_or(0);
        let profile_id: EntityId = generate_id(nonce);
        Storage::profile_count().insert(&context_id, &(nonce + 1));

        let username_nonce = USERNAME_INDEX.insert(&key, &profile_id);

        // Append to the owner's profile list.
        let count = Storage::of_count().get(&(context_id, owner)).unwrap_or(0);
        Storage::of_at().insert(&(context_id, owner, count), &profile_id);
        Storage::of_count().insert(&(context_id, owner), &(count + 1));

        Storage::info().insert(
            &(context_id, profile_id),
            &ProfileData {
                owner,
                username,
                metadata_uri,
                username_nonce,
            },
        );

        profile_id
    }

    /// Replace the metadata URI of an existing profile. Does not touch
    /// the username index. Reverts if not found.
    #[pvm::method]
    pub fn update_profile(context_id: ContextId, profile_id: EntityId, metadata_uri: String) {
        ensure_context_owner(context_id);
        let mut data = match Storage::info().get(&(context_id, profile_id)) {
            Some(d) => d,
            None => revert(b"ProfileNotFound"),
        };
        data.metadata_uri = metadata_uri;
        Storage::info().insert(&(context_id, profile_id), &data);
    }

    /// Rename a profile. O(log n): the old index entry is removed by its
    /// stored nonce, then the new one is inserted. Reverts if the new
    /// username is invalid or already taken in this context.
    #[pvm::method]
    pub fn rename_profile(
        context_id: ContextId,
        profile_id: EntityId,
        new_username: String,
    ) {
        ensure_context_owner(context_id);
        validate_username(new_username.as_str());

        let mut data = match Storage::info().get(&(context_id, profile_id)) {
            Some(d) => d,
            None => revert(b"ProfileNotFound"),
        };
        if data.username == new_username {
            return;
        }

        let new_key = (context_id, new_username.clone());
        if USERNAME_INDEX.contains_key(&new_key) {
            revert(b"UsernameTaken");
        }

        let old_key = (context_id, data.username.clone());
        USERNAME_INDEX.remove_by_nonce(&old_key, data.username_nonce);
        let new_nonce = USERNAME_INDEX.insert(&new_key, &profile_id);

        data.username = new_username;
        data.username_nonce = new_nonce;
        Storage::info().insert(&(context_id, profile_id), &data);
    }

    // --- Queries (open) ---

    #[pvm::method]
    pub fn get_profile_info(context_id: ContextId, profile_id: EntityId) -> Option<Profile> {
        Storage::info()
            .get(&(context_id, profile_id))
            .map(|d| profile_from(profile_id, d))
    }

    /// Cheap owner lookup — use this when you only need to authenticate a
    /// profile (skips the metadata round-trip encoded into `get_profile_info`).
    #[pvm::method]
    pub fn get_profile_owner(context_id: ContextId, profile_id: EntityId) -> Address {
        Storage::info()
            .get(&(context_id, profile_id))
            .map(|d| d.owner)
            .unwrap_or_default()
    }

    #[pvm::method]
    pub fn get_profile_count(context_id: ContextId, owner: Address) -> u32 {
        Storage::of_count().get(&(context_id, owner)).unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_profile_at(
        context_id: ContextId,
        owner: Address,
        index: u32,
    ) -> Option<EntityId> {
        Storage::of_at().get(&(context_id, owner, index))
    }

    /// Batch-fetch profiles owned by `owner`, newest-first. `limit` is capped
    /// at `MAX_PAGE_LIMIT`.
    #[pvm::method]
    pub fn get_profiles_page(
        context_id: ContextId,
        owner: Address,
        offset: u32,
        limit: u32,
    ) -> ProfilePage {
        let total = Storage::of_count().get(&(context_id, owner)).unwrap_or(0);
        let cap = if limit > MAX_PAGE_LIMIT { MAX_PAGE_LIMIT } else { limit };

        if offset >= total || cap == 0 {
            return ProfilePage {
                profiles: Vec::new(),
                next_offset: total,
                done: true,
            };
        }

        let mut profiles: Vec<Profile> = Vec::with_capacity(cap as usize);
        let mut scanned: u32 = 0;

        while profiles.len() < cap as usize && offset + scanned < total {
            let idx = total - 1 - offset - scanned;
            scanned += 1;
            if let Some(profile_id) = Storage::of_at().get(&(context_id, owner, idx)) {
                if let Some(data) = Storage::info().get(&(context_id, profile_id)) {
                    profiles.push(profile_from(profile_id, data));
                }
            }
        }

        let next_offset = offset + scanned;
        let done = next_offset >= total;
        ProfilePage {
            profiles,
            next_offset,
            done,
        }
    }

    /// Page of profiles in `context_id` whose username starts with `prefix`,
    /// in alphabetical order. Sub-linear in the total profile count: the
    /// `USERNAME_INDEX` is walked from the prefix's lower bound until `limit`
    /// entries are produced or the prefix is exhausted. Empty `prefix` is
    /// allowed and returns every profile in `context_id`, alphabetically.
    #[pvm::method]
    pub fn search_by_username_prefix(
        context_id: ContextId,
        prefix: String,
        offset: u32,
        limit: u32,
    ) -> ProfilePage {
        let cap = if limit > MAX_PAGE_LIMIT { MAX_PAGE_LIMIT } else { limit };
        if cap == 0 {
            return ProfilePage {
                profiles: Vec::new(),
                next_offset: offset,
                done: true,
            };
        }

        let lower = (context_id, prefix.clone());
        let upper = upper_bound(context_id, prefix.as_str());
        let to = match &upper {
            Some(u) => Bound::Excluded(u),
            None => Bound::Unbounded,
        };
        let hits = USERNAME_INDEX.range(
            Bound::Included(&lower),
            to,
            offset as u64,
            cap as u64,
        );

        let mut profiles: Vec<Profile> = Vec::with_capacity(hits.len());
        for hit in &hits {
            let pid = hit.1;
            if let Some(data) = Storage::info().get(&(context_id, pid)) {
                profiles.push(profile_from(pid, data));
            }
        }

        let returned = hits.len() as u32;
        ProfilePage {
            profiles,
            next_offset: offset + returned,
            done: returned < cap,
        }
    }

    #[pvm::fallback]
    pub fn fallback() -> Result<(), Error> {
        revert(b"UnknownSelector");
    }
}
