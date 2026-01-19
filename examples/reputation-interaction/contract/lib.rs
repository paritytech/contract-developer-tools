#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod reputation_context_owner {
    use dapps::reputation::{ReputationRef, Review};
    use dapps::systems;
    use dapps::{ContextId, EntityId};
    use ink::prelude::string::String;

    #[ink(storage)]
    pub struct ReputationContextOwner {
        context_id: ContextId,
        reputation: ReputationRef,
    }

    impl ReputationContextOwner {
        #[ink(constructor)]
        pub fn new(context_id: ContextId) -> Self {
            // Register this contract as the owner of some context
            systems::registries::contexts().register_context(context_id);

            Self {
                reputation: systems::reputation(),
                context_id,
            }
        }

        /// Forward a user review to the reputation storage layer.
        #[ink(message)]
        pub fn post_review(&mut self, entity: EntityId, rating: u8, comment_uri: String) {
            if rating == 0 || rating > 5 {
                panic!("rating must be in 1..=5");
            }

            let review = Review {
                rating,
                comment_uri,
            };
            self.reputation
                .submit_review(self.context_id, self.env().caller(), review, entity);
        }

        #[ink(message)]
        pub fn context_id(&self) -> ContextId {
            self.context_id
        }
    }
}
