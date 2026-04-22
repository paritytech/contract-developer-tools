#![no_main]
#![no_std]

// Note: no `use alloc::vec::Vec;` at outer scope — `#[pvm::contract]` emits
// its own for the generated dispatch code and the two collide (E0252).
// `ProfilePage.profiles` uses the fully-qualified `alloc::vec::Vec<Profile>`
// at outer scope; the module below imports Vec locally where it's used.
use alloc::string::String;
use common::{ContextId, EntityId};
use parity_scale_codec::{Decode, Encode};
use pvm::storage::Mapping;
use pvm::Address;
use pvm_contract as pvm;

const MAX_PAGE_LIMIT: u32 = 100;

/// On-chain profile record (SCALE-encoded in storage).
#[derive(Default, Clone, Encode, Decode)]
pub struct ProfileData {
    pub owner: Address,
    pub metadata_uri: String,
}

/// ABI-facing view of a profile. Carries its id so a single call fully
/// describes the record for the client.
#[derive(Default, pvm::SolAbi)]
pub struct Profile {
    pub profile_id: EntityId,
    pub owner: Address,
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

/// Profile + the owner's primary name resolved via `@polkadot/names`.
/// `primary_name` is the empty string when the owner has no primary set.
#[derive(Default, pvm::SolAbi)]
pub struct ProfileWithName {
    pub profile_id: EntityId,
    pub owner: Address,
    pub metadata_uri: String,
    pub primary_name: String,
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

fn profile_from(profile_id: EntityId, data: ProfileData) -> Profile {
    Profile {
        profile_id,
        owner: data.owner,
        metadata_uri: data.metadata_uri,
    }
}

#[pvm::contract(cdm = "@polkadot/profiles")]
mod profiles {
    use super::{
        pvm, profile_from, Address, ContextId, EntityId, Profile, ProfileData, ProfilePage,
        ProfileWithName, Storage, String, MAX_PAGE_LIMIT,
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

    /// Create a new profile for `owner`. One address may own many profiles;
    /// each call mints a fresh id. `metadata_uri` may be empty.
    #[pvm::method]
    pub fn create_profile(
        context_id: ContextId,
        owner: Address,
        metadata_uri: String,
    ) -> EntityId {
        ensure_context_owner(context_id);

        let nonce = Storage::profile_count().get(&context_id).unwrap_or(0);
        let profile_id: EntityId = generate_id(nonce);
        Storage::profile_count().insert(&context_id, &(nonce + 1));

        // Append to the owner's profile list.
        let count = Storage::of_count().get(&(context_id, owner)).unwrap_or(0);
        Storage::of_at().insert(&(context_id, owner, count), &profile_id);
        Storage::of_count().insert(&(context_id, owner), &(count + 1));

        Storage::info().insert(
            &(context_id, profile_id),
            &ProfileData {
                owner,
                metadata_uri,
            },
        );

        profile_id
    }

    /// Replace the metadata URI of an existing profile. Reverts if not found.
    /// Auth of "is caller really the owner?" is the app-layer's job — this
    /// system contract only enforces the context-owner gate.
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

    // --- Queries (open) ---

    #[pvm::method]
    pub fn get_profile_info(context_id: ContextId, profile_id: EntityId) -> Option<Profile> {
        Storage::info()
            .get(&(context_id, profile_id))
            .map(|d| profile_from(profile_id, d))
    }

    /// Like `get_profile_info`, plus the owner's primary name resolved via
    /// `@polkadot/names`. `primary_name` is `""` when none is set. Reverts
    /// `NamesCallFailed` if the names registry is unreachable.
    #[pvm::method]
    pub fn get_profile_info_with_name(
        context_id: ContextId,
        profile_id: EntityId,
    ) -> Option<ProfileWithName> {
        let data = Storage::info().get(&(context_id, profile_id))?;
        let primary_name = match names::cdm_reference().primary_of(context_id, data.owner) {
            Ok(s) => s,
            Err(_) => revert(b"NamesCallFailed"),
        };
        Some(ProfileWithName {
            profile_id,
            owner: data.owner,
            metadata_uri: data.metadata_uri,
            primary_name,
        })
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
    /// at `MAX_PAGE_LIMIT`. Deleted profiles (never, currently — there's no
    /// delete) would be skipped while `next_offset` still advances.
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

    #[pvm::fallback]
    pub fn fallback() -> Result<(), Error> {
        revert(b"UnknownSelector");
    }
}
