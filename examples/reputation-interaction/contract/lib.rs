#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod reputation_context_owner {
    use contract_tools::{ContextId, EntityId};
    use ink::{env::call::FromAddr, prelude::string::String};
    use reputation::{ReputationRef, Review};

    #[ink(storage)]
    pub struct ReputationContextOwner {
        context_id: ContextId,
        reputation: ReputationRef,
    }

    impl ReputationContextOwner {
        #[ink(constructor)]
        pub fn new(reputation_ptr: Address, context_id: ContextId) -> Self {
            let mut reputation_contract = ReputationRef::from_addr(reputation_ptr);
            // Register this contract as the context owner inside the storage layer.
            reputation_contract.register_context(context_id);

            Self {
                reputation: reputation_contract,
                context_id,
            }
        }

        /// Forward a user review to the reputation storage layer.
        #[ink(message)]
        pub fn post_review(
            &mut self,
            entity: EntityId,
            rating: u8,
            comment_uri: String,
        ) {
            if rating == 0 || rating > 5 {
                panic!("rating must be in 1..=5");
            }

            let review = Review {
                rating,
                comment_uri,
            };
            self.reputation.submit_review(
                self.context_id,
                self.env().caller(),
                review,
                entity,
            );
        }

        #[ink(message)]
        pub fn context_id(&self) -> ContextId {
            self.context_id
        }
    }
}
