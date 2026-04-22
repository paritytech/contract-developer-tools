#![no_main]
#![no_std]

use alloc::string::String;
use common::ContextId;
use parity_scale_codec::{Decode, Encode};
use pvm::Address;
use pvm::storage::Mapping;
use pvm_contract as pvm;

const MAX_NAME_LEN: usize = 128;
const MAX_URI_LEN: usize = 512;
const MAX_PAGE_LIMIT: u32 = 100;

#[derive(Default, Clone, Encode, Decode)]
pub struct NameData {
    pub owner: Address,
    pub metadata_uri: String,
    pub owner_index: u32,
}

#[derive(Default, pvm::SolAbi)]
pub struct Name {
    pub name: String,
    pub owner: Address,
    pub metadata_uri: String,
}

// Fully-qualify `alloc::vec::Vec<Name>` here: a top-level `use alloc::vec::Vec`
// would collide with the Vec import emitted by `#[pvm::contract]` for its
// dispatch code (E0252), matching the pattern in `profiles/lib.rs`.
#[derive(Default, pvm::SolAbi)]
pub struct NamePage {
    pub names: alloc::vec::Vec<Name>,
    pub next_offset: u32,
    pub done: bool,
}

#[pvm::storage]
struct Storage {
    context_registry: contexts::Reference,
    info: Mapping<(ContextId, String), NameData>,
    of_count: Mapping<(ContextId, Address), u32>,
    of_at: Mapping<(ContextId, Address, u32), String>,
    primary_of: Mapping<(ContextId, Address), String>,
}

fn name_from(name: String, data: NameData) -> Name {
    Name {
        name,
        owner: data.owner,
        metadata_uri: data.metadata_uri,
    }
}

#[pvm::contract(cdm = "@polkadot/names")]
mod names {
    use super::{
        Address, ContextId, MAX_NAME_LEN, MAX_PAGE_LIMIT, MAX_URI_LEN, Name, NameData, NamePage,
        Storage, String, name_from, pvm,
    };
    use alloc::vec::Vec;
    use common::revert;
    use pvm::caller;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        Storage::context_registry().set(&contexts::cdm_reference());
        Ok(())
    }

    // --- Authorization helpers ---

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

    fn ensure_name_owner_or_context(context_id: ContextId, name: &String) -> NameData {
        let data = match Storage::info().get(&(context_id, name.clone())) {
            Some(d) => d,
            None => revert(b"NameNotFound"),
        };
        if caller() != data.owner {
            ensure_context_owner(context_id);
        }
        data
    }

    fn ensure_name_owner(context_id: ContextId, name: &String) -> NameData {
        let data = match Storage::info().get(&(context_id, name.clone())) {
            Some(d) => d,
            None => revert(b"NameNotFound"),
        };
        if caller() != data.owner {
            revert(b"Unauthorized");
        }
        data
    }

    // Remove `idx` from owner's list via swap-and-pop, fixing the moved
    // record's `owner_index` in `info` so the invariant holds.
    fn swap_and_pop_from_owner(context_id: ContextId, owner: Address, idx: u32) {
        let count = Storage::of_count().get(&(context_id, owner)).unwrap_or(0);
        let last = count
            .checked_sub(1)
            .unwrap_or_else(|| revert(b"OwnerIndexUnderflow"));

        if idx != last {
            let moved_name = match Storage::of_at().get(&(context_id, owner, last)) {
                Some(n) => n,
                None => revert(b"IndexMissing"),
            };
            Storage::of_at().insert(&(context_id, owner, idx), &moved_name);
            let mut moved_data = match Storage::info().get(&(context_id, moved_name.clone())) {
                Some(d) => d,
                None => revert(b"NameMissingOnSwap"),
            };
            moved_data.owner_index = idx;
            Storage::info().insert(&(context_id, moved_name), &moved_data);
        }
        Storage::of_at().remove(&(context_id, owner, last));
        Storage::of_count().insert(&(context_id, owner), &last);
    }

    fn clear_primary_if_matches(context_id: ContextId, owner: Address, name: &String) {
        if let Some(primary) = Storage::primary_of().get(&(context_id, owner)) {
            if &primary == name {
                Storage::primary_of().remove(&(context_id, owner));
            }
        }
    }

    // --- Mutations (auth-gated) ---

    #[pvm::method]
    pub fn register_name(
        context_id: ContextId,
        name: String,
        owner: Address,
        metadata_uri: String,
    ) {
        ensure_context_owner(context_id);

        if name.is_empty() {
            revert(b"NameEmpty");
        }
        if name.len() > MAX_NAME_LEN {
            revert(b"NameTooLong");
        }
        if metadata_uri.len() > MAX_URI_LEN {
            revert(b"UriTooLong");
        }
        if Storage::info().contains(&(context_id, name.clone())) {
            revert(b"NameTaken");
        }

        let owner_index = Storage::of_count().get(&(context_id, owner)).unwrap_or(0);

        Storage::of_at().insert(&(context_id, owner, owner_index), &name);
        Storage::of_count().insert(
            &(context_id, owner),
            &owner_index
                .checked_add(1)
                .unwrap_or_else(|| revert(b"Overflow")),
        );
        Storage::info().insert(
            &(context_id, name),
            &NameData {
                owner,
                metadata_uri,
                owner_index,
            },
        );
    }

    #[pvm::method]
    pub fn transfer_name(context_id: ContextId, name: String, new_owner: Address) {
        let data = ensure_name_owner_or_context(context_id, &name);
        let old_owner = data.owner;

        swap_and_pop_from_owner(context_id, old_owner, data.owner_index);
        clear_primary_if_matches(context_id, old_owner, &name);

        let new_index = Storage::of_count()
            .get(&(context_id, new_owner))
            .unwrap_or(0);
        Storage::of_at().insert(&(context_id, new_owner, new_index), &name);
        Storage::of_count().insert(
            &(context_id, new_owner),
            &new_index
                .checked_add(1)
                .unwrap_or_else(|| revert(b"Overflow")),
        );

        Storage::info().insert(
            &(context_id, name),
            &NameData {
                owner: new_owner,
                metadata_uri: data.metadata_uri,
                owner_index: new_index,
            },
        );
    }

    #[pvm::method]
    pub fn update_metadata(context_id: ContextId, name: String, metadata_uri: String) {
        let data = ensure_name_owner_or_context(context_id, &name);
        if metadata_uri.len() > MAX_URI_LEN {
            revert(b"UriTooLong");
        }
        Storage::info().insert(
            &(context_id, name),
            &NameData {
                owner: data.owner,
                metadata_uri,
                owner_index: data.owner_index,
            },
        );
    }

    #[pvm::method]
    pub fn release_name(context_id: ContextId, name: String) {
        let data = ensure_name_owner_or_context(context_id, &name);
        swap_and_pop_from_owner(context_id, data.owner, data.owner_index);
        clear_primary_if_matches(context_id, data.owner, &name);
        Storage::info().remove(&(context_id, name));
    }

    #[pvm::method]
    pub fn set_primary(context_id: ContextId, name: String) {
        let _ = ensure_name_owner(context_id, &name);
        Storage::primary_of().insert(&(context_id, caller()), &name);
    }

    #[pvm::method]
    pub fn clear_primary(context_id: ContextId) {
        Storage::primary_of().remove(&(context_id, caller()));
    }

    // --- Queries (open) ---

    #[pvm::method]
    pub fn resolve(context_id: ContextId, name: String) -> Address {
        Storage::info()
            .get(&(context_id, name))
            .map(|d| d.owner)
            .unwrap_or_default()
    }

    #[pvm::method]
    pub fn get_name_info(context_id: ContextId, name: String) -> Option<Name> {
        Storage::info()
            .get(&(context_id, name.clone()))
            .map(|d| name_from(name, d))
    }

    #[pvm::method]
    pub fn primary_of(context_id: ContextId, owner: Address) -> String {
        Storage::primary_of()
            .get(&(context_id, owner))
            .unwrap_or_default()
    }

    #[pvm::method]
    pub fn is_available(context_id: ContextId, name: String) -> bool {
        !Storage::info().contains(&(context_id, name))
    }

    #[pvm::method]
    pub fn max_name_len() -> u32 {
        MAX_NAME_LEN as u32
    }

    #[pvm::method]
    pub fn get_name_count(context_id: ContextId, owner: Address) -> u32 {
        Storage::of_count()
            .get(&(context_id, owner))
            .unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_name_at(context_id: ContextId, owner: Address, index: u32) -> Option<String> {
        Storage::of_at().get(&(context_id, owner, index))
    }

    /// Batch-fetch names owned by `owner`, newest-first. `limit` capped at
    /// `MAX_PAGE_LIMIT`. Mirrors `profiles::get_profiles_page`.
    #[pvm::method]
    pub fn get_names_page(
        context_id: ContextId,
        owner: Address,
        offset: u32,
        limit: u32,
    ) -> NamePage {
        let total = Storage::of_count().get(&(context_id, owner)).unwrap_or(0);
        let cap = if limit > MAX_PAGE_LIMIT {
            MAX_PAGE_LIMIT
        } else {
            limit
        };

        if offset >= total || cap == 0 {
            return NamePage {
                names: Vec::new(),
                next_offset: total,
                done: true,
            };
        }

        let mut names: Vec<Name> = Vec::with_capacity(cap as usize);
        let mut scanned: u32 = 0;

        while names.len() < cap as usize && offset + scanned < total {
            let idx = total - 1 - offset - scanned;
            scanned += 1;
            if let Some(name) = Storage::of_at().get(&(context_id, owner, idx)) {
                if let Some(data) = Storage::info().get(&(context_id, name.clone())) {
                    names.push(name_from(name, data));
                }
            }
        }

        let next_offset = offset + scanned;
        let done = next_offset >= total;
        NamePage {
            names,
            next_offset,
            done,
        }
    }

    #[pvm::fallback]
    pub fn fallback() -> Result<(), Error> {
        revert(b"UnknownSelector");
    }
}
