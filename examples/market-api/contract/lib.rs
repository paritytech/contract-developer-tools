#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod market_api {
    use dapps::{
        ContextId, EntityId, disputes,
        disputes::{Dispute, DisputesRef},
        entity_graph,
        entity_graph::EntityGraphRef,
        math, registries, reputation,
        reputation::{ReputationRef, Review},
    };
    use ink::prelude::string::String;

    #[ink(storage)]
    pub struct MarketApi {
        context_id: ContextId,
        reputation: ReputationRef,
        graph: EntityGraphRef,
        disputes: DisputesRef,
    }

    impl MarketApi {
        #[ink(constructor)]
        pub fn new(context_id: ContextId) -> Self {
            // Register this contract as the owner of some context
            registries::contexts::reference().register_context(context_id);

            Self {
                reputation: reputation::reference(),
                disputes: disputes::reference(),
                graph: entity_graph::reference(),
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
    }
}
