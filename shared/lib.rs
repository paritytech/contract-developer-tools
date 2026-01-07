#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::Address;
use ink::env::Timestamp;
use ink::prelude::string::String;

pub type EntityId = u8; //[u8; 32];
pub type EntityType = u8;
pub type ContextId = u64;
pub type Person = u8; //[u8; 32];
pub type TransactionId = u64;
pub type Score = u8; // 0..100

pub type TransactionKey = (ContextId, TransactionId, EntityType);
pub type EntityKey = (ContextId, EntityId);
pub const NO_ENTITY: u8 = 0;
//pub const NO_ENTITY: [u8; 32] = [0; 32];
pub const NO_RATING: u8 = 255;



#[derive(Debug)]
#[derive(Default, Clone, PartialEq)]
#[ink::storage_item(packed)]
pub struct Rating {
    pub transaction_id: TransactionId,
    pub rater: Person,
    pub entity_id: EntityId,
    pub entity_type: EntityType,
    pub timestamp: Timestamp,
    pub rating: u8, //0..100
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
    #[ink(topic)] 
    pub entity_id: EntityId, 
    pub entity_type: EntityType,
    pub timestamp: Timestamp,
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
    #[ink(topic)]
    pub entity_id: EntityId,
    pub timestamp: Timestamp,
    pub entity_type: EntityType,
    pub score: Score

}

