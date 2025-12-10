#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::prelude::vec::Vec;
use ink::Address;
use ink::env::Timestamp;
use ink::prelude::string::String;

pub type EntityId = u8; //[u8; 32];
pub type EntityType = u8;
pub type ContextId = u64;
pub type Person = u8; //[u8; 32];
pub type TransactionId = u64;
pub type Score = u8; // 0..100
//pub type Rating = (Person, EntityId, Timestamp, Score, Option<String>);

pub const NO_ENTITY: u8 = 0;
//pub const NO_ENTITY: [u8; 32] = [0; 32];
pub const NO_RATING: u8 = 255;
//pub mod errors;
//pub mod events;


//#[ink(storage)]
#[derive(Debug)]
#[derive(Default)]
#[ink::storage_item(packed)]
pub struct Rating {

    pub rater: Person,
    pub entity_id: EntityId,
    pub timestamp: Timestamp,
    pub rating: u8,
    pub remark: Option<String>

}


#[ink::error]
#[derive(PartialEq, Debug)]
pub enum Error {
    ContextAlreadyExists,
    ContextNotFound,
    NotOwner,
    TransactionAlreadyRated

}

#[ink::event]
pub struct RatingSubmitted {
    #[ink(topic)]
    pub context: ContextId,
    #[ink(topic)]
    pub user: Person,
    #[ink(topic)] // TODO maybe combined key with entity type
    pub entity_id: EntityId, //TODO or use rating struct?
    pub timestamp: Timestamp,
    pub entity_type: EntityType,
    pub rating: u8,
    pub remark: Option<String>
}    

#[ink::event]
pub struct ContextCreated {
    #[ink(topic)]
    pub context: ContextId,
    #[ink(topic)]
    pub owner: Address,
    pub time: Timestamp
}

#[ink::event]
pub struct ScoreUpdated {
    #[ink(topic)]
    pub context: ContextId,
    #[ink(topic)] // TODO maybe combined key with entity type
    pub entity_id: EntityId,
    pub timestamp: Timestamp,
    pub entity_type: EntityType,
    pub score: Score

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

