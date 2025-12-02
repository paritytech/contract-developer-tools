use ink::Address;

use shared::{ReputationCalculator, EntityId};

#[ink::contract]
mod marketplace_calculator {
    use super::*;
    use ink::prelude::vec::Vec;

    #[ink(storage)]
    pub struct MarketplaceCalculator {}

    impl MarketplaceCalculator {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {}
        }
    }

    impl ReputationCalculator for MarketplaceCalculator {
        #[ink(message)]
        fn validate_transaction_proof(
            &self,
            rater: Address,
            ratee: Address,
            proof: Vec<u8>,
        ) -> bool {
            // your validation logic
            !proof.is_empty() && rater != ratee
        }

        #[ink(message)]
        fn calculate_score(&self, domain_specific_data: Vec<u8>) -> u64 {
            // decode and compute – placeholder example
            if domain_specific_data.is_empty() {
                50
            } else {
                100
            }
        }

        #[ink(message)]
        fn aggregate_hierarchical(
            &self,
            _child_ids: Vec<EntityId>,
            child_scores: Vec<u64>,
            weights: Vec<u32>,
        ) -> u64 {
            if child_scores.is_empty() || child_scores.len() != weights.len() {
                return 50;
            }

            let mut num: u128 = 0;
            let mut den: u128 = 0;

            for (score, w) in child_scores.into_iter().zip(weights.into_iter()) {
                num += score as u128 * w as u128;
                den += w as u128;
            }

            if den == 0 {
                50
            } else {
                (num / den) as u64
            }
        }

        #[ink(message)]
        fn apply_decay(
            &self,
            score: u64,
            elapsed_time: u32,
            half_life: u32,
        ) -> u64 {
            if half_life == 0 {
                return score;
            }
            // simple linear decay example
            let elapsed = elapsed_time.min(half_life);
            let decay = (score as u128 * elapsed as u128) / (half_life as u128 * 2);
            (score as u128 - decay) as u64
        }
    }
}
