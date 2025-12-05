#![cfg_attr(not(feature = "std"), no_std)]

use ink::prelude::{vec::Vec, string::String};
use ink::Address;
use ink::storage::Mapping;

/// 1:1 with `bytes32` in Solidity
pub type EntityId = [u8; 32];
pub type ContextId = [u8; 32];


/**
 * 
 */
#[ink::storage_item(packed)]
#[derive(Default)]
pub struct ProductReview {
    pub rating: u8,
    pub comment: String,
}

/**
 * 
 */
#[ink::storage_item(packed)]
#[derive(Default)]
pub struct SellerReview {
    pub rating: u8,
    pub comment: String,
}

/**
 * 
 */
#[derive(Default, Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct ProductMetadata {
    pub average_score: u64,
    pub total_ratings: u32,
}

/**
 * Aggregated data for a seller
 */
#[derive(Default, Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct SellerMetadata {
    pub average_score: u64,
    pub total_ratings: u32,

    pub average_product_score: u64,
    pub total_products: u32,
}

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

#[ink::trait_definition]
pub trait ReputationCalculator {

    /**
     * what is this function intended to do?
     */
    #[ink(message)]
    fn validate_transaction_proof(
        &self,
        rater: Address,
        ratee: Address,
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





/**
 * 
 * vvv  SAMPLE CONTRACT CODE  vvv
 * 
 */

pub type CardId = u32;
pub type GameId = u32;

#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum CardType {
    Unit,
    Spell,
}

#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum EffectType {
    None = 0,
    Taunt = 1,
    Charge = 2,
    HealSelf = 3,
    DamageFront = 4,
}

#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct CardMetadata {
    pub id: CardId,
    pub name_hash: u32,
    pub rarity: u8,
    pub card_type: CardType,
    pub cost: u8,
    pub attack: u8,
    pub health: u8,
    pub effects: EffectType,
}

/// Interface for game contracts to query card data from NFT contracts
#[ink::trait_definition]
pub trait CardDataProvider {
    /// Get card metadata by ID
    #[ink(message)]
    fn get_card_metadata(&self, card_id: CardId) -> Option<CardMetadata>;
    
    /// Check if a card exists
    #[ink(message)]
    fn card_exists(&self, card_id: CardId) -> bool;
    
    /// Get all cards owned by an address
    #[ink(message)]
    fn cards_of_owner(&self, owner: Address) -> Vec<CardId>;
}

/// Game-specific types (could be moved to a separate game_types crate if needed)
#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct UnitInstance {
    pub card_id: CardId,
    pub current_hp: i16,
    pub acted_this_turn: bool,
}

#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct PlayerState {
    pub addr: Address,
    pub hp: i16,
    pub energy: u8,
    pub max_energy: u8,
    pub deck: Vec<CardId>,
    pub hand: Vec<CardId>,
    pub board: [Option<UnitInstance>; 4],
}

#[derive(PartialEq, Eq, Clone)]
#[cfg_attr(feature = "std", derive(Debug, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum GameStatus {
    WaitingForPlayers,
    InProgress,
    Finished,
}

#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct Game {
    pub id: GameId,
    pub players: [PlayerState; 2],
    pub active_idx: u8,
    pub turn: u32,
    pub status: GameStatus,
}

#[derive(Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum ActionType {
    PlayCard { hand_index: u8, slot_index: u8 },
    UseSpell { hand_index: u8, target_slot: u8 },
    EndTurn,
    Concede,
}