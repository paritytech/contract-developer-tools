#![no_main]
#![no_std]

use alloc::string::String;
use common::{ContextId, EntityId, revert, math};
use pvm::storage::Mapping;
use pvm::{Address, caller};
use pvm_contract as pvm;

use parity_scale_codec::{Decode, Encode};

#[derive(Default, Clone, Encode, Decode, pvm::SolAbi)]
pub struct Review {
    pub reviewer: Address,
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
    reviews: Mapping<(ContextId, EntityId, u64), Review>,
    address_review_index: Mapping<(ContextId, Address, EntityId), u64>,
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
        let mut avg = Storage::metrics()
            .get(&(context_id, entity))
            .unwrap_or_default();

        let index = match Storage::address_review_index().get(&(context_id, reviewer, entity)) {
            Some(i) => {
                let prev = Storage::reviews().get(&(context_id, entity, i)).map(|r| r.rating);
                avg.update(prev, Some(rating));
                i
            }
            None => {
                let i = avg.n_entries();
                avg.update(None, Some(rating));
                Storage::address_review_index().insert(&(context_id, reviewer, entity), &i);
                i
            }
        };

        Storage::reviews().insert(&(context_id, entity, index), &Review {
            reviewer,
            rating,
            comment_uri,
        });
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
        if let Some(pos) = Storage::address_review_index().get(&(context_id, reviewer, entity)) {
            let old_review = Storage::reviews()
                .get(&(context_id, entity, pos))
                .expect("index inconsistency");

            let mut avg = Storage::metrics()
                .get(&(context_id, entity))
                .unwrap_or_default();
            avg.update(Some(old_review.rating), None);
            let last = avg.n_entries(); // count after removal
            Storage::metrics().insert(&(context_id, entity), &avg);

            // Swap-and-pop
            if pos != last {
                let tail = Storage::reviews()
                    .get(&(context_id, entity, last))
                    .expect("index inconsistency");
                Storage::address_review_index().insert(&(context_id, tail.reviewer, entity), &pos);
                Storage::reviews().insert(&(context_id, entity, pos), &tail);
            }

            Storage::reviews().remove(&(context_id, entity, last));
            Storage::address_review_index().remove(&(context_id, reviewer, entity));
        }
    }

    #[pvm::method]
    pub fn get_rating(context_id: ContextId, reviewer: Address, entity: EntityId) -> u8 {
        Storage::address_review_index()
            .get(&(context_id, reviewer, entity))
            .and_then(|i| Storage::reviews().get(&(context_id, entity, i)))
            .map(|r| r.rating)
            .unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_review_at(context_id: ContextId, entity: EntityId, index: u64) -> Review {
        Storage::reviews()
            .get(&(context_id, entity, index))
            .unwrap_or_default()
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
