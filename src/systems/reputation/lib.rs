#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::prelude::string::String;


#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct Review {
    pub rating: u8,
    pub comment_uri: String,
}

#[ink::contract]
mod reputation {
    use ink::storage::Mapping;
    use ink::env::call::FromAddr;
    use contract_tools::{ContextId, EntityId};
    use registries::contexts::ContextRegistryRef;
    use super::*;

    #[ink(storage)]
    pub struct Reputation {
        /*
         * Reference to the deployed context registry contract
         */
        pub context_registry: ContextRegistryRef,

        /*
         * Store all reviews across all contexts, where the `Address`
         * is the reviewer, and the `EntityId` is the entity being reviewed.
         */
        pub reviews: Mapping<(ContextId, Address, EntityId), Review>,
    }

    impl Reputation {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                context_registry: ContextRegistryRef::from_addr(addresses::CONTEXT_REGISTRY),
                reviews: Mapping::default(),
            }
        }

        /**
            Submit a review for an entity within a context. Only the context owner can submit reviews.
         */
        #[ink(message)]
        pub fn submit_review(&mut self, context_id: ContextId, reviewer: Address, review: Review, entity: EntityId) {
            let caller: Address = self.env().caller();

            if !self.context_registry.is_owner(context_id, caller) {
                panic!("Only context owner can submit reviews");
            }

            self.reviews.insert(&(context_id, reviewer, entity), &review);
        }

        /**
            Delete a review for an entity within a context. Only the context owner can delete reviews.
         */
        #[ink(message)]
        pub fn delete_review(&mut self, context_id: ContextId, reviewer: Address, entity: EntityId) {
            let caller: Address = self.env().caller();

            if !self.context_registry.is_owner(context_id, caller) {
                panic!("Only context owner can delete reviews");
            }

            self.reviews.remove(&(context_id, reviewer, entity));
        }
    }
}
