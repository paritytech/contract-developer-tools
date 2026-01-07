#![cfg_attr(not(feature = "std"), no_std, no_main)]

/*
* 
*/
#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct Review {
    pub rating: u8,
    pub comment_uri: String,
}

#[ink::contract]
mod reputation {
    use ink::{storage::Mapping};
    use contract_tools::{ContextId, EntityId};
    use super::*;

    #[ink(storage)]
    pub struct Reputation {
        
        /*
         * Mapping of context IDs to their owners.
         * (presumably the owner is a contract, but can be any address)
         */
        pub context_owners: Mapping<ContextId, Address>,

        /*
         * Store all reviews across contexts all contexts, where the `Address`
         * is the reviewer, and the `EntityId` is the entity being reviewed.
         */
        pub reviews: Mapping<(ContextId, Address, EntityId), Review>,
    }

    impl Reputation {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { 
                context_owners: Mapping::default(),
                reviews: Mapping::default(),
            }
        }

        /**
            Register a new context with the caller as the owner. 
         */
        #[ink(message)]
        pub fn register_context(&mut self, context_id: ContextId) {
            let caller: Address = self.env().caller();

            if self.context_owners.get(&context_id).is_some() {
                panic!("Context ID already registered");
            }
            self.context_owners.insert(&context_id, &caller);
        }

        /**
            Submit a review for an entity within a context. Only the context owner can submit reviews.
         */
        #[ink(message)]
        pub fn submit_review(&mut self, context_id: ContextId, reviewer: Address, review: Review, entity: EntityId) {
            let caller: Address = self.env().caller();

            let context_owner = self.context_owners.get(&context_id);
            if context_owner.is_none() || context_owner.unwrap() != caller {
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

            let context_owner = self.context_owners.get(&context_id);
            if context_owner.is_none() || context_owner.unwrap() != caller {
                panic!("Only context owner can delete reviews");
            }

            self.reviews.remove(&(context_id, reviewer, entity));
        }
    }
}
