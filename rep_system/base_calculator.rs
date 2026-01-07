//! Marketplace-specific reputation calculator implementation.
//!
//! This module provides a custom implementation of the `ReputationCalculator` trait
//! for marketplace-specific score calculations, including validation, aggregation,
//! and time-based decay.

use ink::Address;

use shared::{ReputationCalculator, EntityId};

#[ink::contract]
mod marketplace_calculator {
    use super::*;
    use ink::prelude::vec::Vec;

    /// A marketplace-specific reputation calculator.
    ///
    /// Implements custom logic for validating transaction proofs, calculating scores,
    /// aggregating hierarchical scores, and applying time-based decay.
    #[ink(storage)]
    pub struct MarketplaceCalculator {}

    impl MarketplaceCalculator {
        /// Creates a new marketplace calculator instance.
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {}
        }
    }

    impl ReputationCalculator for MarketplaceCalculator {
        /// Validates that a transaction proof is legitimate.
        ///
        /// # Arguments
        /// * `rater` - The address of the user submitting the rating
        /// * `ratee` - The address of the entity being rated
        /// * `proof` - Arbitrary proof data (e.g., transaction receipt)
        ///
        /// # Returns
        /// `true` if the proof is valid and rater != ratee, `false` otherwise.
        #[ink(message)]
        fn validate_transaction_proof(
            &self,
            rater: Address,
            ratee: Address,
            proof: Vec<u8>,
        ) -> bool {
            // Basic validation: proof must exist and rater can't rate themselves
            !proof.is_empty() && rater != ratee
        }

        /// Calculates a score from domain-specific data.
        ///
        /// # Arguments
        /// * `domain_specific_data` - Encoded data for score calculation
        ///
        /// # Returns
        /// A score value (placeholder: 50 if empty, 100 otherwise).
        #[ink(message)]
        fn calculate_score(&self, domain_specific_data: Vec<u8>) -> u64 {
            // Placeholder implementation
            if domain_specific_data.is_empty() {
                50
            } else {
                100
            }
        }

        /// Aggregates child entity scores into a parent score using weighted average.
        ///
        /// # Arguments
        /// * `_child_ids` - IDs of child entities (unused in this implementation)
        /// * `child_scores` - Scores of the child entities
        /// * `weights` - Weights for each child score
        ///
        /// # Returns
        /// The weighted average score, or 50 if inputs are invalid.
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

        /// Applies time-based decay to a score.
        ///
        /// Uses a simple linear decay model where the score decreases proportionally
        /// to elapsed time relative to the half-life.
        ///
        /// # Arguments
        /// * `score` - The original score
        /// * `elapsed_time` - Time elapsed since the score was recorded
        /// * `half_life` - The time period over which the score decays by half
        ///
        /// # Returns
        /// The decayed score value.
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
            // Simple linear decay
            let elapsed = elapsed_time.min(half_life);
            let decay = (score as u128 * elapsed as u128) / (half_life as u128 * 2);
            (score as u128 - decay) as u64
        }
    }
}
