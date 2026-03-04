#![no_main]
#![no_std]

use alloc::string::String;
use common::{ContextId, EntityId, revert, math};
use pvm::storage::Mapping;
use pvm::{Address, caller};
use pvm_contract as pvm;

use parity_scale_codec::{Decode, Encode};

#[derive(Default, Clone, Encode, Decode)]
pub struct Review {
    pub rating: u8,
    pub comment_uri: String,
}

#[derive(pvm::SolAbi)]
pub struct Metrics {
    pub average: u8,
    pub count: u64,
}

#[pvm::storage]
struct Storage {
    context_registry: contexts::Reference,
    metrics: Mapping<(ContextId, EntityId), math::RunningAverage>,
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
            revert(b"Unauthorized");
        }
        let prev_rating = Storage::reviews()
            .get(&(context_id, reviewer, entity))
            .map(|r| r.rating);
        let review = Review {
            rating,
            comment_uri,
        };
        Storage::reviews().insert(&(context_id, reviewer, entity), &review);

        let mut avg = Storage::metrics()
            .get(&(context_id, entity))
            .unwrap_or_default();
        avg.update(prev_rating, Some(rating));
        Storage::metrics().insert(&(context_id, entity), &avg);
    }

    #[pvm::method]
    pub fn delete_review(context_id: ContextId, reviewer: Address, entity: EntityId) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            revert(b"Unauthorized");
        }
        if let Some(old_review) = Storage::reviews().get(&(context_id, reviewer, entity)) {
            let mut avg = Storage::metrics()
                .get(&(context_id, entity))
                .unwrap_or_default();
            avg.update(Some(old_review.rating), None);
            Storage::metrics().insert(&(context_id, entity), &avg);
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

    #[pvm::method]
    pub fn get_metrics(context_id: ContextId, entity: EntityId) -> Metrics {
        Storage::metrics()
            .get(&(context_id, entity))
            .map(|m| Metrics {
                average: m.val(),
                count: m.n_entries(),
            })
            .unwrap_or(Metrics { average: 0, count: 0 })
    }
}
