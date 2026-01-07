#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod rep_system {

    use ink::prelude::vec::Vec;
    use ink::{env::emit_event, storage::{Mapping}};
    use shared::*;

    use scale::{EncodeLike};
    use ink::storage::traits::{Packed, StorageKey};


    #[ink(storage)]
    pub struct RepSystem {
                
        // owner of a context to restrict rating submission
        pub owners: Mapping<ContextId, Address>,
        pub transactions: Mapping<ContextId, Vec<TransactionId>>,
        pub ratings_per_transaction: Mapping<TransactionKey, Rating>,
        pub transaction_per_entity: Mapping<EntityKey, Vec<TransactionId>>,
        pub scores_per_entity: Mapping<EntityKey, Vec<u8>>,
        pub score_cache: Mapping<EntityKey, u8>

    }

    impl RepSystem {

        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owners: Mapping::default(),
                transactions: Mapping::default(),
                ratings_per_transaction: Mapping::default(), 
                transaction_per_entity: Mapping::default(),
                scores_per_entity: Mapping::default(),
                score_cache: Mapping::default()
            }
        }

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

        #[ink(message)]
        pub fn get_transactions_for_entity(&self, context: ContextId, entity_id: EntityId) -> Vec<TransactionId> {
            return self.transaction_per_entity.get((context, entity_id)).unwrap_or(Vec::new());
        }

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

        #[ink(message)]
        pub fn get_score(&self, context: ContextId, entity: EntityId) -> Score {

            let key: EntityKey = (context, entity);
            //println!("{:#?}", self.score_cache.get(key));
            match self.score_cache.get(key) {
                Some(score) => return score,
                None => return NO_RATING
            }
        }

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

        fn check_owner(&self, context: ContextId) -> Result<(), Error> {
            match self.owners.get(context) {
                Some(owner) => 
                    if self.env().caller() != owner {
                        return Err(Error::NotOwner);
                    } else { return Ok(()) },
                None => return Err(Error::ContextNotFound)
            }

        }

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

