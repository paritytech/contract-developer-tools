#![cfg_attr(not(feature = "std"), no_std, no_main)]

//use ink::env::hash::{Keccak256, HashOutput};


#[ink::contract]
mod mark3t_rep {

    use ink::env::emit_event;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;
    //use ink::prelude::collections::HashMap;

    use ink::storage::{Mapping, StorageVec};
    use ink::storage::traits::{Packed, StorageKey};
    
    use scale::{Encode, EncodeLike};
    use shared::{ContextId, EntityId, ScoreUpdated, TransactionId, *};
    //use shared::{ContextId, EntityId, EntityType, Error, NO_ENTITY, Person, Score};
    use shared::NO_RATING;
    type RatingKey = (ContextId, TransactionId, EntityType);
    type ScoreKey = (ContextId, EntityId);

    type PurchaseId = shared::TransactionId;
    type SellerId = EntityId;
    type BuyerId = EntityId;

    const CONTEXT: ContextId = 1;

    const TYPE_SELLER: EntityType = 2;    
    const TYPE_ARTICLE: EntityType = 3;
    const TYPE_SHIPPING: EntityType = 4;

    const TYPE_BUYER: EntityType = 5;
    
    #[derive(Debug)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct SellerRating {
        purchase_id: PurchaseId, 
        buyer: Person,
        seller_id: SellerId,
        article_id: EntityId,
        seller_score: Score, 
        article_score: Score, 
        shipping_score: Score, 
        remark: Option<String>
        
    }

    #[ink(storage)]
    pub struct Mark3tRep {
        
        // owner of a context to restrict rating submission
        pub owners: Mapping<ContextId, Address>,
        //pub calculators: Mapping<ContextId, Address>,
        pub relations: Mapping<(ContextId, EntityType), Vec<EntityType>>,
        pub transactions: Mapping<ContextId, Vec<TransactionId>>,
        pub ratings_per_transaction: Mapping<RatingKey, Rating>,
        //pub rating_keys: StorageVec<RatingKey>,
        pub scores_per_entity: Mapping<ScoreKey, Vec<u8>>,
        pub score_cache: Mapping<ScoreKey, u8>
    }

    impl Mark3tRep {

        #[ink(constructor)]
        pub fn new() -> Self {
            let mut instance = Self { 
                owners: Mapping::default(),
                //calculators: Mapping::default(),
                relations: Mapping::default(),
                transactions: Mapping::default(),
                ratings_per_transaction: Mapping::default(), 
                //rating_keys: StorageVec::new(),
                scores_per_entity: Mapping::default(),
                score_cache: Mapping::default()
            };
            
            // vv move to App layer
            instance.register_context(CONTEXT);
            instance.insert_relation(CONTEXT, TYPE_ARTICLE, TYPE_BUYER);
            instance.insert_relation(CONTEXT, TYPE_SHIPPING, TYPE_BUYER);
            // ^^ 
            
            instance
        }


        #[ink(message)]
        pub fn submit_seller_rating(&mut self, seller_rating: SellerRating,
            /* purchase_id: PurchaseId, 
            buyer: Person,
            seller_id: SellerId,
            article_id: EntityId,
            seller_score: Score, 
            article_score: Score, 
            shipping_score: Score, 
            remark: Option<String>*/) -> Result<(), Error> {
            
                let timestamp = self.env().block_timestamp();

                let _ = self.submit_rating(CONTEXT, seller_rating.purchase_id, TYPE_ARTICLE, Rating{rater: seller_rating.buyer, entity_id: seller_rating.article_id, timestamp: timestamp, rating: seller_rating.article_score, remark: None});
                let _ = self.submit_rating(CONTEXT, seller_rating.purchase_id, TYPE_SHIPPING, Rating{rater: seller_rating.buyer, entity_id: NO_ENTITY, timestamp: timestamp, rating: seller_rating.shipping_score, remark: None});
                let _ = self.submit_rating(CONTEXT, seller_rating.purchase_id, TYPE_SELLER, Rating{rater: seller_rating.buyer, entity_id: seller_rating.seller_id, timestamp: timestamp, rating: seller_rating.seller_score, remark: seller_rating.remark});

                self.update_seller_score(seller_rating.seller_id);

               
                Ok(())

        }

        #[ink(message)]
        pub fn get_seller_score(&self, seller_id: SellerId) -> Score {
            self.get_score(CONTEXT, seller_id)
        }

        #[ink(message)]
        pub fn get_all_seller_ratings(&self) -> Vec<SellerRating> {
            let mut result = Vec::new();
            /*
            for i in 0..self.rating_keys.len() {
                let elem = self.rating_keys.get(i);
            }
            */
            let types = [TYPE_ARTICLE, TYPE_SHIPPING, TYPE_SELLER];
            let ratings = self.get_ratings(CONTEXT, types.to_vec());
            ratings.iter().for_each(|t| {
                let article_rating = t.1.get(0).unwrap();
                let shipping_rating = t.1.get(1).unwrap();
                let seller_rating = t.1.get(2).unwrap();
                
                result.push(SellerRating {
                    article_id: article_rating.entity_id,
                    purchase_id: t.0,
                    buyer: seller_rating.rater,
                    seller_id: seller_rating.entity_id,
                    seller_score: seller_rating.rating,
                    article_score: article_rating.rating,
                    shipping_score: shipping_rating.rating,
                    remark: seller_rating.remark.clone()
                });
            });
            

            result
        }

        #[ink(message)]
        pub fn get_seller_rating(&self, transaction: TransactionId) {
            


        }

        fn update_seller_score(&mut self, seller_id: SellerId) -> () {
            let key: ScoreKey = (CONTEXT, seller_id);

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

            self.update_score(CONTEXT, seller_id, TYPE_SELLER, score);

            // TODO or submit in generic layer?
            emit_event(ScoreUpdated {
                context: CONTEXT,
                entity_id: seller_id,
                timestamp: self.env().block_timestamp(),
                entity_type: TYPE_SELLER,
                score: score
            });
            
            
            
        }

        // vv Generic stuff to move to Rep_System vv

        fn get_ratings(&self, context: ContextId, entity_types: Vec<EntityType>) -> Vec<(TransactionId, Vec<Rating>)> { 
            
            let mut result = Vec::new();
            match self.transactions.get(context) {
                Some(txs) => {
                    
                    txs.iter().copied().for_each(|tx| { 
                        let mut ratings = Vec::new();
                        entity_types.iter().for_each(|et| {
                            let key = (context, tx, et);
                            match self.ratings_per_transaction.get(key) {
                                Some(r) => {

                                    //println!("Rating {:?} {:?}", key, r);
                                    ratings.push(r);
                                },
                                _ => () // handle here, if ratings become optional

                            }
                            
                        });
                        result.push((tx, ratings));


                    });
                },
                _ => {
                    //TODO throw error?
                }
                
            }
            return result;
        }

        fn update_score(&mut self, context: ContextId, entity_id: EntityId, entity_type: EntityType, score: Score) -> Result<(), Error> {
            self.check_owner(context);

            let key: ScoreKey = (CONTEXT, entity_id);

            self.score_cache.insert(key, &score);


            Ok(())

        }

        fn register_context(&mut self, context: ContextId) -> Result<(), Error> {
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

        fn submit_rating(&mut self, context: ContextId, transaction: TransactionId, typ: EntityType, rating: Rating) -> Result<(), Error> {
            self.check_owner(context)?;

            let key: RatingKey = (context, transaction, typ);
            if self.ratings_per_transaction.contains(key) {
                return Err(Error::TransactionAlreadyRated);
            }

            
            Mark3tRep::insert_list_element_into(&mut self.transactions, &context, transaction);
            //println!("{:?}", self.transactions.get(context));
            //let mut ctx_txs = .get(context).unwrap(); // TODO unknown ctx
            //ctx_txs.insert(transaction);

            self.ratings_per_transaction.insert(key, &rating); // TODO try_insert ?

            let score_key: ScoreKey = (context, rating.entity_id);
            //println!("Before Insert {:?}", self.scores_per_entity.get(score_key));
            Mark3tRep::insert_list_element_into(&mut self.scores_per_entity, &score_key, rating.rating);
            //println!("After Insert {:?}", self.scores_per_entity.get(score_key));

            emit_event(RatingSubmitted { 
                context: context, 
                entity_type: typ, 
                user: rating.rater,
                timestamp: rating.timestamp,
                entity_id: rating.entity_id, 
                rating: rating.rating, 
                remark: rating.remark }
            );

            Ok(())
        }

       
        fn get_score(&self, context: ContextId, entity: EntityId) -> Score {
            // TODO also checkOwner??
            let key: ScoreKey = (context, entity);
            //println!("{:#?}", self.score_cache.get(key));
            match self.score_cache.get(key) {
                Some(score) => return score,
                None => return NO_RATING
            }
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

        fn insert_relation(&mut self, context:ContextId, from: EntityType, to: EntityType) -> () {
            let key = (context, to);
            Mark3tRep::insert_list_element_into(&mut self.relations, &key, from);
            
        }

        fn insert_list_element_into<K: EncodeLike, E: EncodeLike + Packed, KT: StorageKey>(mapping: &mut Mapping<K, Vec<E>, KT>, key: &K, elem: E) {
            let mut list = mapping.get(key).unwrap_or_default();
            list.push(elem);
            mapping.insert(key, &list);

        }
    


    }
    

    #[cfg(test)]
    mod tests {
        //use ink::{Address, env::address};

        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        //const SELLER1: SellerId = [42; 32];
        //const BUYER1: BuyerId = [69; 32];   
        //const ARTICLE1: [u8;32] = [1; 32];
        const SELLER1: SellerId = 42;
        const BUYER1: BuyerId = 69;
        const ARTICLE1: u8 = 1;

        const PURCHASE1: u64 = 1234;
        const PURCHASE2: u64 = 5678;

        /**
         * Sample dummy test
         */
        #[ink::test]
        fn get_seller_score() {

            let mut market_rep = Mark3tRep::new();
            let ctx = 1;
            
            //let owner = Address::from([2; 20]);
            assert_eq!(market_rep.get_seller_score(SELLER1), NO_RATING as u8); // TODO or error for non-existent context?
            //let _ = market_rep.register_context(ctx);
            //assert_eq!(market_rep.get_seller_score(SELLER1), NO_RATING as u8);

        }
        #[ink::test]
        fn submit_seller_rating() {
            
            let mut market_rep = Mark3tRep::new();
            
            //let owner = Address::from([2; 20]); 

            assert_eq!(market_rep.get_seller_score(SELLER1), NO_RATING as u8);

            //let seller_score1 = 90;
            //let article_score1 = 80;
            //let shipping_score1 = 60;
            //let submit_res1 = market_rep.submit_seller_rating(PURCHASE1, BUYER1, SELLER1, ARTICLE1, seller_score1, article_score1, shipping_score1, Some("Great seller.".into()));
            let rating1 = SellerRating{purchase_id: PURCHASE1, buyer: BUYER1, seller_id: SELLER1, article_id: ARTICLE1, seller_score: 90, article_score: 80, shipping_score: 60, remark: Some("Great seller.".into())};
            let submit_res1 = market_rep.submit_seller_rating(rating1);
            assert_eq!(Ok(()), submit_res1, "Error submitting seller rating");
            assert_eq!(market_rep.get_seller_score(SELLER1), 90, "Wrong score after rating 1. submission.");

            //let seller_score2 = 30;
            //let article_score2 = 10;
            //let shipping_score2 = 20;
            //let submit_res2 = market_rep.submit_seller_rating(PURCHASE2, BUYER1, SELLER1, ARTICLE1, seller_score2, article_score2, shipping_score2, Some("Could be better".into()));
            let rating2 = SellerRating{purchase_id: PURCHASE2, buyer: BUYER1, seller_id: SELLER1, article_id: ARTICLE1, seller_score: 30, article_score: 10, shipping_score: 20, remark: Some("Could be better".into())};
            let submit_res2 = market_rep.submit_seller_rating(rating2);


            assert_eq!(Ok(()), submit_res2, "Error submitting seller rating");
            assert_eq!(market_rep.get_seller_score(SELLER1), 60, "Wrong score after rating 2. submission.");

            let all_ratings = market_rep.get_all_seller_ratings();
            all_ratings.iter().for_each(|t| {
                println!("{:?}", t);
            });

            assert_eq!(2, all_ratings.len());

        }

        



    }
    

}

#[cfg(all(test, feature = "e2e-tests"))]
mod e2e_tests;
