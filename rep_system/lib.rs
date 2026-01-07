//! Core reputation system smart contract.
//!
//! This contract provides a generic, context-based reputation system that can be
//! used by other contracts (like `mark3t_rep`) to store and retrieve ratings.
//! It supports multiple rating contexts, each owned by a specific address.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod rep_system {

    use ink::prelude::vec::Vec;
    use ink::{env::emit_event, storage::{Mapping}};
    use shared::*;

    use scale::{EncodeLike};
    use ink::storage::traits::{Packed, StorageKey};

    /// The core reputation system contract.
    ///
    /// Manages rating contexts, stores ratings per transaction, and maintains
    /// aggregated scores for entities. Each context has an owner who controls
    /// rating submissions within that context.
    #[ink(storage)]
    pub struct RepSystem {
        /// Maps context IDs to their owner addresses.
        pub owners: Mapping<ContextId, Address>,
        /// Maps context IDs to lists of transaction IDs.
        pub transactions: Mapping<ContextId, Vec<TransactionId>>,
        /// Stores individual ratings keyed by (context, transaction, entity_type).
        pub ratings_per_transaction: Mapping<TransactionKey, Rating>,
        /// Maps entities to their associated transaction IDs.
        pub transaction_per_entity: Mapping<EntityKey, Vec<TransactionId>>,
        /// Stores all rating values for each entity (used for score calculation).
        pub scores_per_entity: Mapping<EntityKey, Vec<u8>>,
        /// Cached aggregated scores for entities.
        pub score_cache: Mapping<EntityKey, u8>,
    }

    impl RepSystem {
        /// Creates a new reputation system contract instance.
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owners: Mapping::default(),
                transactions: Mapping::default(),
                ratings_per_transaction: Mapping::default(),
                transaction_per_entity: Mapping::default(),
                scores_per_entity: Mapping::default(),
                score_cache: Mapping::default(),
            }
        }

        /// Retrieves all ratings for a specific entity, grouped by transaction.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `entity_id` - The entity to get ratings for
        /// * `entity_types` - The entity types to include in each transaction's ratings
        ///
        /// # Returns
        /// A vector of rating vectors, where each inner vector contains ratings for one transaction.
        #[ink(message)]
        pub fn get_ratings_for_entity(&self, context: ContextId, entity_id: EntityId, entity_types: Vec<EntityType>) -> Vec<Vec<Rating>> {
            let mut result = Vec::new();
            match self.transaction_per_entity.get((context, entity_id)) {
                Some(txs) => {
                    txs.iter().for_each(|tx| {
                        let tx_ratings = self.get_ratings_for_transaction(context, *tx, entity_types.clone());
                        result.push(tx_ratings);
                    });
                },
                _ => () //TODO unknown entity
            }

            return result;
        }

        /// Retrieves ratings for a specific transaction.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `transaction` - The transaction ID to get ratings for
        /// * `entity_types` - The entity types to retrieve ratings for
        ///
        /// # Returns
        /// A vector of ratings for the specified transaction.
        ///
        /// # Panics
        /// Panics if the transaction is not found.
        #[ink(message)]
        pub fn get_ratings_for_transaction(&self, context: ContextId, transaction: TransactionId, entity_types: Vec<EntityType>) -> Vec<Rating> {
            let mut ratings = Vec::new();
            entity_types.iter().for_each(|et| {
                let key = (context, transaction, et);
                match self.ratings_per_transaction.get(key) {
                    Some(r) => ratings.push(r),
                    _ => panic!("transaction not found")

                }
                
            });
            
            return ratings;
        }

        /// Retrieves all ratings in a context, grouped by transaction.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `entity_types` - The entity types to include in each transaction's ratings
        ///
        /// # Returns
        /// A vector of rating vectors, where each inner vector contains ratings for one transaction.
        #[ink(message)]
        pub fn get_ratings(&self, context: ContextId, entity_types: Vec<EntityType>) -> Vec<Vec<Rating>> { 
            let mut result = Vec::new();
            match self.transactions.get(context) {
                Some(txs) => {
                    txs.iter().copied().for_each(|tx| { 
                        let ratings = self.get_ratings_for_transaction(context, tx, entity_types.clone());
                        result.push(ratings);
                    });
                },
                _ => {
                    
                }
                
            }
            return result;
        }

        /// Retrieves all transaction IDs associated with a specific entity.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `entity_id` - The entity to get transactions for
        ///
        /// # Returns
        /// A vector of transaction IDs, or an empty vector if none found.
        #[ink(message)]
        pub fn get_transactions_for_entity(&self, context: ContextId, entity_id: EntityId) -> Vec<TransactionId> {
            return self.transaction_per_entity.get((context, entity_id)).unwrap_or(Vec::new());
        }

        /// Registers a new rating context with the caller as owner.
        ///
        /// Only the owner can submit ratings within the context.
        ///
        /// # Arguments
        /// * `context` - The unique context ID to register
        ///
        /// # Returns
        /// * `Ok(())` - Context registered successfully
        /// * `Err(Error::ContextAlreadyExists)` - Context ID already in use
        #[ink(message)]
        pub fn register_context(&mut self, context: ContextId) -> Result<(), Error> {
            if self.owners.contains(context) {
                return Err(Error::ContextAlreadyExists)
            }
            let owner = self.env().caller();
            self.owners.insert(context, &owner);

            emit_event(ContextCreated {
                context: context,
                owner: owner,
                time: self.env().block_timestamp()
            });
            return Ok(())
        }

        /// Submits a new rating for an entity within a transaction.
        ///
        /// Only the context owner can submit ratings. Each (transaction, entity_type)
        /// combination can only be rated once.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `rating` - The rating to submit
        ///
        /// # Returns
        /// * `Ok(())` - Rating submitted successfully
        /// * `Err(Error::NotOwner)` - Caller is not the context owner
        /// * `Err(Error::ContextNotFound)` - Context does not exist
        /// * `Err(Error::TransactionAlreadyRated)` - This transaction/entity_type was already rated
        #[ink(message)]
        pub fn submit_rating(&mut self, context: ContextId, rating: Rating) -> Result<(), Error> {
            self.check_owner(context)?;

            let tx_key: TransactionKey = (context, rating.transaction_id, rating.entity_type);
            if self.ratings_per_transaction.contains(tx_key) {
                return Err(Error::TransactionAlreadyRated);
            }

            RepSystem::insert_list_element_into(&mut self.transactions, &context, rating.transaction_id);

            self.ratings_per_transaction.insert(tx_key, &rating); 
            
            let entity_key: EntityKey = (context, rating.entity_id);
            RepSystem::insert_list_element_into(&mut self.transaction_per_entity, &entity_key, rating.transaction_id);
            //println!("Before Insert {:?}", self.scores_per_entity.get(score_key));
            RepSystem::insert_list_element_into(&mut self.scores_per_entity, &entity_key, rating.rating);
            //println!("After Insert {:?}", self.scores_per_entity.get(score_key));

            emit_event(RatingSubmitted { 
                context: context, 
                entity_type: rating.entity_type, 
                user: rating.rater,
                timestamp: rating.timestamp,
                entity_id: rating.entity_id, 
                rating: rating.rating, 
                remark: rating.remark }
            );

            Ok(())
        }

        /// Retrieves the cached aggregated score for an entity.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `entity` - The entity ID to get the score for
        ///
        /// # Returns
        /// The aggregated score (0-100), or `NO_RATING` (255) if no score exists.
        #[ink(message)]
        pub fn get_score(&self, context: ContextId, entity: EntityId) -> Score {
            let key: EntityKey = (context, entity);
            match self.score_cache.get(key) {
                Some(score) => return score,
                None => return NO_RATING
            }
        }

        /// Updates the aggregated score for an entity based on all submitted ratings.
        ///
        /// Calculates the average of all ratings for the entity and caches the result.
        /// Only the context owner can update scores.
        ///
        /// # Arguments
        /// * `context` - The rating context ID
        /// * `entity_id` - The entity to update the score for
        /// * `entity_type` - The type of entity (used in event emission)
        /// * `score` - Unused (score is calculated from stored ratings)
        ///
        /// # Returns
        /// * `Ok(())` - Score updated successfully
        /// * `Err(Error::NotOwner)` - Caller is not the context owner
        /// * `Err(Error::ContextNotFound)` - Context does not exist
        #[ink(message)]
        pub fn update_score(&mut self, context: ContextId, entity_id: EntityId, entity_type: EntityType, score: Score) -> Result<(), Error> {
            self.check_owner(context)?;

            let key: EntityKey = (context, entity_id);

            // TODO delegate to calculator in general
            // TODO implement score aggregation for shipping and article
            let score: Score = match self.scores_per_entity.get(key) {
                Some(scores) => {
                    let sum: u32 = scores.iter().map(|&x| x as u32).sum();
                    let avg: u32 = sum / scores.len() as u32;
                    avg as Score  
                },
                None => {
                    panic!("Should not happen") // if called correctly after submission
                }
            };

            emit_event(ScoreUpdated {
                context: context,
                entity_id: entity_id,
                timestamp: self.env().block_timestamp(),
                entity_type: entity_type,
                score: score
            });

            self.score_cache.insert(key, &score);

            return Ok(());
        }

        /// Verifies that the caller is the owner of the specified context.
        ///
        /// # Arguments
        /// * `context` - The context ID to check ownership for
        ///
        /// # Returns
        /// * `Ok(())` - Caller is the owner
        /// * `Err(Error::NotOwner)` - Caller is not the owner
        /// * `Err(Error::ContextNotFound)` - Context does not exist
        fn check_owner(&self, context: ContextId) -> Result<(), Error> {
            match self.owners.get(context) {
                Some(owner) =>
                    if self.env().caller() != owner {
                        return Err(Error::NotOwner);
                    } else { return Ok(()) },
                None => return Err(Error::ContextNotFound)
            }
        }

        /// Helper function to insert an element into a list stored in a mapping.
        ///
        /// If the element already exists in the list, it is not added again.
        ///
        /// # Arguments
        /// * `mapping` - The mapping containing lists
        /// * `key` - The key for the list
        /// * `elem` - The element to insert
        fn insert_list_element_into<K: EncodeLike, E: EncodeLike + Packed + Eq, KT: StorageKey>(mapping: &mut Mapping<K, Vec<E>, KT>, key: &K, elem: E) {
            let mut list = mapping.get(key).unwrap_or_default();
            if !list.contains(&elem){
                list.push(elem);
            }
            mapping.insert(key, &list);

        }
    }


    #[cfg(test)]
    mod tests {

        use super::*;
        use shared::{EntityType, Person};
        const CTX: ContextId = 1;
        const RATER1: Person = 2;
        const E_ID1: EntityId = 42;
        const E_ID2: EntityId = 43;
        const E_TYPE1: EntityType = 69;
   
        #[ink::test]
        fn submit_rating() {
            let mut rep_system = RepSystem::new();
            
            let _ = rep_system.register_context(CTX);
            let ent_id: EntityId = 42;
            //let owner = Address::from([2; 20]);
            assert_eq!(NO_RATING, rep_system.get_score(CTX, ent_id)); 

            assert_eq!(Vec::<Vec<Rating>>::with_capacity(0), rep_system.get_ratings(CTX, [1,2,3].to_vec()));

            let r1 = Rating { transaction_id: 1, rater: RATER1, entity_id: E_ID1, entity_type: E_TYPE1, timestamp: 123, rating: 30, remark: None };
            let r2 = Rating { transaction_id: 2, rater: RATER1, entity_id: E_ID2, entity_type: E_TYPE1, timestamp: 234, rating: 60, remark: None };
            let r3 = Rating { transaction_id: 3, rater: RATER1, entity_id: E_ID2, entity_type: E_TYPE1, timestamp: 345, rating: 90, remark: None };
            submit(&mut rep_system, r1.clone());
            submit(&mut rep_system, r2.clone());
            submit(&mut rep_system, r3.clone());
            
            assert_eq!(vec![vec![r1], vec![r2], vec![r3]], rep_system.get_ratings(CTX, vec![E_TYPE1]));

            assert_eq!(rep_system.get_score(CTX, ent_id), NO_RATING);

        }


        fn submit(rep_system: &mut RepSystem, rating: Rating) {
            let submit_res = rep_system.submit_rating(CTX, rating.clone());
            assert_eq!(Ok(()), submit_res, "Error submitting rating");
        }
    }

}

pub use self::rep_system::RepSystem;

