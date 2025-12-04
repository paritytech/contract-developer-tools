#![cfg_attr(not(feature = "std"), no_std)]

use ink::prelude::vec::Vec;
use ink::Address;
use ink::storage::Mapping;
use ink::env::Timestamp;


/// 1:1 with `bytes32` in Solidity
pub type EntityId = [u8; 32];
pub type EntityType =[u8; 32];
pub type ContextId = [u8; 32];

pub mod errors;
pub mod events;

#[ink::storage_item]
#[derive(Default)]
pub struct ReputationContext {
    /**
     * I think `scores` and `last_updated` should be stored flattly in 
     * `ReputationContext`. and then here we only store a registry of `EntityId`s
     * 
     * This would make it easier to have cross-context reputation queries/aggregation
     */

    pub user_ids: Mapping<Address, EntityId>,
    pub hierarchies: Mapping<EntityId, Vec<EntityId>>,

    pub calculator_ptr: Address,
    pub calculator_constants: Vec<u8>,

    /**
     * These should be configured in some calculator
     * no need for hardcoded reference to decay here
     */
    // pub decay_enabled: bool,
    // pub decay_half_life: u32,

    /// uint32 totalRatings;
    pub total_ratings: u32,
}


#[ink::error]
pub enum Error {
    ContextAlreadyExists,
    NotOwner

}

#[ink::event]
pub struct RatingSubmitted {
    #[ink(topic)]
    context: ContextId,
    #[ink(topic)]
    user: Address,
    entity_id: EntityId,
    entity_type: EntityType,
    rating: u32
}    

#[ink::event]
pub struct ContextCreated {
    #[ink(topic)]
    pub context: ContextId,
    #[ink(topic)]
    pub owner: Address,
    pub time: Timestamp
}



#[ink::trait_definition]
pub trait ReputationCalculator {

    /**
     * what is this function intended to do?
     */
    #[ink(message)]
    fn validate_transaction_proof(
        &self,
        rater: Address,
        ratee: Address, // is this
        proof: Vec<u8>,
    ) -> bool;

    /**
     * Calculate a reputation score given some domain-specific payload
     */
    #[ink(message)]
    fn calculate_score(
        &self,
        payload: Vec<u8>,
    ) -> u64;

    /**
     * Calculate an aggregate score given child scores and weights
     * 
     * side-note: how does panicking work in contracts? for example
     * if a calculator overflows summing the child_scores together
     */
    #[ink(message)]
    fn aggregate_hierarchical(
        &self,
        child_scores: Vec<u64>,
        weights: Vec<u32>,
    ) -> u64;

    // Optional decay (dApp can "disable" by returning `score` unchanged)
    // #[ink(message)]
    // fn apply_decay(
    //     &self,
    //     score: u64,
    //     elapsed_time: u32,
    //     half_life: u32,
    // ) -> u64;

}

