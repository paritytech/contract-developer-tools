//! Shared types and constants for the reputation system.
//!
//! This module provides common type definitions, constants, and data structures
//! used across the reputation system contracts including `rep_system` and `mark3t_rep`.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::Address;
use ink::env::Timestamp;
use ink::prelude::string::String;
// REMARK: For now all types are just ints for easier usage and testing.  Must later ofc be set to something appropriate like a byte array for a hash.

/// Unique identifier for an entity (seller, article, etc.).
pub type EntityId = u8; //[u8; 32];

/// Type discriminator for entities (e.g., seller, article, shipping).
pub type EntityType = u8;

/// Unique identifier for a rating context (e.g., a marketplace).
pub type ContextId = u64;

/// Identifier for a person (rater/buyer).
pub type Person = u8; //[u8; 32];

/// Unique identifier for a transaction/purchase.
pub type TransactionId = u64;

/// Reputation score value (0-100 scale).
pub type Score = u8; // 0..100

/// Composite key for looking up ratings by context, transaction, and entity type.
pub type TransactionKey = (ContextId, TransactionId, EntityType);

/// Composite key for looking up data by context and entity.
pub type EntityKey = (ContextId, EntityId);

/// Sentinel value indicating no associated entity.
pub const NO_ENTITY: u8 = 0;
//pub const NO_ENTITY: [u8; 32] = [0; 32];

/// Sentinel value indicating no rating exists (unrated).
pub const NO_RATING: u8 = 255;



/// A single rating submission for an entity within a transaction.
///
/// Ratings are submitted by users (raters) for specific entities (e.g., sellers, articles)
/// and include a numeric score and optional text remark.
#[derive(Debug)]
#[derive(Default, Clone, PartialEq)]
#[ink::storage_item(packed)]
pub struct Rating {
    /// The transaction this rating belongs to.
    pub transaction_id: TransactionId,
    /// The person who submitted this rating.
    pub rater: Person,
    /// The entity being rated.
    pub entity_id: EntityId,
    /// The type/category of the entity being rated.
    pub entity_type: EntityType,
    /// Block timestamp when the rating was submitted.
    pub timestamp: Timestamp,
    /// Numeric rating value (0-100 scale).
    pub rating: u8, //0..100
    /// Optional text comment/feedback.
    pub remark: Option<String>
}


/// Errors that can occur in the reputation system.
#[ink::error]
#[derive(PartialEq, Debug)]
pub enum Error {
    /// Attempted to register a context that already exists.
    ContextAlreadyExists,
    /// The specified context was not found.
    ContextNotFound,
    /// Caller is not the owner of the context.
    NotOwner,
    /// A rating for this transaction has already been submitted.
    TransactionAlreadyRated,
}

/// Event emitted when a new rating is submitted.
#[ink::event]
pub struct RatingSubmitted {
    /// The context in which the rating was submitted.
    #[ink(topic)]
    pub context: ContextId,
    /// The user who submitted the rating.
    #[ink(topic)]
    pub user: Person,
    /// The entity that was rated.
    #[ink(topic)]
    pub entity_id: EntityId,
    /// The type of entity that was rated.
    pub entity_type: EntityType,
    /// Timestamp of the rating submission.
    pub timestamp: Timestamp,
    /// The numeric rating value.
    pub rating: u8,
    /// Optional text remark.
    pub remark: Option<String>,
}

/// Event emitted when a new rating context is created.
#[ink::event]
pub struct ContextCreated {
    /// The ID of the newly created context.
    #[ink(topic)]
    pub context: ContextId,
    /// The owner/creator of the context.
    #[ink(topic)]
    pub owner: Address,
    /// Timestamp when the context was created.
    pub time: Timestamp,
}

/// Event emitted when an entity's aggregated score is updated.
#[ink::event]
pub struct ScoreUpdated {
    /// The context containing the entity.
    #[ink(topic)]
    pub context: ContextId,
    /// The entity whose score was updated.
    #[ink(topic)]
    pub entity_id: EntityId,
    /// Timestamp of the score update.
    pub timestamp: Timestamp,
    /// The type of entity.
    pub entity_type: EntityType,
    /// The new aggregated score.
    pub score: Score,
}

