#![no_main]
#![no_std]

use dapps_core::{self as _, ContextId, EntityId};

use alloc::string::String;
use pvm_contract as pvm;
use pvm_contract::storage::Mapping;
use pvm_contract::{Address, caller};

use parity_scale_codec::{Decode, Encode};

#[derive(Default, Clone, Encode, Decode)]
pub struct Review {
    pub rating: u8,
    pub comment_uri: String,
}

#[pvm::storage]
struct Storage {
    context_registry: contexts::Reference,
    reviews: Mapping<(ContextId, Address, EntityId), Review>,
}

#[pvm::contract(cdm = "@polkadot/reputation")]
mod reputation {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        let ctx_reg = contexts::cdm_reference();
        Storage::context_registry().set(&ctx_reg);
        Ok(())
    }

    #[pvm::method]
    pub fn submit_review(
        context_id: ContextId,
        reviewer: Address,
        entity: EntityId,
        rating: u8,
        comment_uri: String,
    ) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }
        let review = Review {
            rating,
            comment_uri,
        };
        Storage::reviews().insert(&(context_id, reviewer, entity), &review);
    }

    #[pvm::method]
    pub fn delete_review(context_id: ContextId, reviewer: Address, entity: EntityId) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }
        Storage::reviews().remove(&(context_id, reviewer, entity));
    }

    #[pvm::method]
    pub fn get_rating(context_id: ContextId, reviewer: Address, entity: EntityId) -> u8 {
        Storage::reviews()
            .get(&(context_id, reviewer, entity))
            .map(|r| r.rating)
            .unwrap_or(0)
    }
}
