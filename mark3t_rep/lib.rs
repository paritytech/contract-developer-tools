#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod mark3t_rep {

    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

    use rep_system::RepSystemRef;
    use shared::{ContextId, EntityId, EntityType, Rating, TransactionId, Error, Score, Person, NO_ENTITY};
   
    type PurchaseId = shared::TransactionId;
    type SellerId = EntityId;
    type BuyerId = EntityId;

    const CONTEXT: ContextId = 1;

    const TYPE_SELLER: EntityType = 2;    
    const TYPE_ARTICLE: EntityType = 3;
    const TYPE_SHIPPING: EntityType = 4;

    const TYPE_BUYER: EntityType = 5;

    const SELL_TYPES: [EntityType; 3] = [TYPE_ARTICLE, TYPE_SHIPPING, TYPE_SELLER];
    
    #[derive(Debug, PartialEq, Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct SellerRating {
        purchase_id: PurchaseId, 
        timestamp: Timestamp,
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
        rep_system: RepSystemRef
    }

    impl Mark3tRep {

        #[ink(constructor)]
        pub fn new(rep_system_addr: ink::Address) -> Self {
            //let rep_system: RepSystemRef = RepSystemRef::from(rep_system_addr);
            let other_contract: RepSystemRef = ink::env::call::FromAddr::from_addr(rep_system_addr);
            
            let mut instance = Self {
                rep_system: other_contract
            };

            let _ = instance.rep_system.register_context(CONTEXT);
            instance
            
        }


        #[ink(message)]
        pub fn submit_seller_rating(&mut self, seller_rating: SellerRating) -> Result<(), Error> {
            
            let timestamp = self.env().block_timestamp();

            let _ = self.rep_system.submit_rating(CONTEXT, Rating { transaction_id: seller_rating.purchase_id, rater: seller_rating.buyer, entity_id: seller_rating.article_id, entity_type: TYPE_ARTICLE, timestamp: timestamp, rating: seller_rating.article_score * 20, remark: None});
            let _ = self.rep_system.submit_rating(CONTEXT, Rating { transaction_id: seller_rating.purchase_id, rater: seller_rating.buyer, entity_id: NO_ENTITY, entity_type: TYPE_SHIPPING, timestamp: timestamp, rating: seller_rating.shipping_score * 20, remark: None});
            let _ = self.rep_system.submit_rating(CONTEXT, Rating { transaction_id: seller_rating.purchase_id, rater: seller_rating.buyer, entity_id: seller_rating.seller_id, entity_type: TYPE_SELLER, timestamp: timestamp, rating: seller_rating.seller_score * 20, remark: seller_rating.remark});

            self.rep_system.update_score(CONTEXT, seller_rating.seller_id, TYPE_SELLER, seller_rating.seller_score)?;
            self.rep_system.update_score(CONTEXT, seller_rating.article_id, TYPE_ARTICLE, seller_rating.article_score)?;
            
            Ok(())

        }

        #[ink(message)]
        pub fn get_all_seller_ratings(&self) -> Vec<SellerRating> {
            let mut result = Vec::new();

            let ratings = self.rep_system.get_ratings(CONTEXT, SELL_TYPES.to_vec());
            ratings.iter().for_each(|t| {
                result.push(Mark3tRep::to_seller_rating_from_vec(t.clone()));
            });

            result
        }

        #[ink(message)]
        pub fn get_all_seller_ratings_for(&self, seller_id: SellerId) -> Vec<SellerRating> {

            let result: Vec<SellerRating> = self.rep_system.get_ratings_for_entity(CONTEXT, seller_id, SELL_TYPES.to_vec())
                .iter().map(|tx_ratings| {
                    Mark3tRep::to_seller_rating_from_vec(tx_ratings.clone())
            }).collect();

            return result;
        }

        #[ink(message)]
        pub fn get_seller_rating(&self, transaction: TransactionId) -> Option<SellerRating> {
            let ratings = self.rep_system.get_ratings_for_transaction(CONTEXT, transaction, SELL_TYPES.to_vec());
            if ratings.is_empty() {
                return None;
            } else {
                return Some(Mark3tRep::to_seller_rating_from_vec(ratings));
            }
        }

        
        #[ink(message)]
        pub fn get_seller_score(&self, seller_id: SellerId) -> Score {
            self.rep_system.get_score(CONTEXT, seller_id)
        }

        #[ink(message)]
        pub fn get_purchases(&self, seller_id: SellerId) -> Vec<PurchaseId> {
            return self.rep_system.get_transactions_for_entity(CONTEXT, seller_id);
        }


        fn to_seller_rating_from_vec(ratings: Vec<Rating>) -> SellerRating {
            let article_rating = ratings.get(0).unwrap();
            let shipping_rating = ratings.get(1).unwrap();
            let seller_rating = ratings.get(2).unwrap();

            Mark3tRep::to_seller_rating(article_rating, shipping_rating, seller_rating)
        }

        fn to_seller_rating(article_rating: &Rating, shipping_rating: &Rating, seller_rating: &Rating) -> SellerRating {
            return SellerRating {
                article_id: article_rating.entity_id,
                purchase_id: seller_rating.transaction_id,
                timestamp: seller_rating.timestamp,
                buyer: seller_rating.rater,
                seller_id: seller_rating.entity_id,
                seller_score: seller_rating.rating / 20,
                article_score: article_rating.rating / 20,
                shipping_score: shipping_rating.rating / 20,
                remark: seller_rating.remark.clone()
            };

        }

  
    }
    /*
     
    #[cfg(test)]
    mod tests {
        //use ink::{Address, env::address};

        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        //const SELLER1: SellerId = [42; 32];
        //const BUYER1: BuyerId = [69; 32];   
        //const ARTICLE1: [u8;32] = [1; 32];
        const SELLER1: SellerId = 42;
        const SELLER2: SellerId = 84;
        const BUYER1: BuyerId = 69;
        const ARTICLE1: u8 = 1;

        const PURCHASE1: u64 = 1234;
        const PURCHASE2: u64 = 3456;
        const PURCHASE3: u64 = 5678;


        #[ink::test]
        fn get_seller_score() {

            let mut market_rep = Mark3tRep::new();
       
            assert_eq!(market_rep.get_seller_score(SELLER1), NO_RATING as u8);

            submit(&mut market_rep, SellerRating{purchase_id: PURCHASE1, timestamp: 1, buyer: BUYER1, seller_id: SELLER1, article_id: ARTICLE1, seller_score: 5, article_score: 4, shipping_score: 5, remark: Some("Great seller.".into())});

            assert_eq!(market_rep.get_seller_score(SELLER1), 100, "Wrong score after rating 1. submission.");

            submit(&mut market_rep, SellerRating{purchase_id: PURCHASE2, timestamp: 2, buyer: BUYER1, seller_id: SELLER1, article_id: ARTICLE1, seller_score: 3, article_score: 4, shipping_score: 3, remark: Some("Could be better".into())});

            assert_eq!(market_rep.get_seller_score(SELLER1), 80, "Wrong score after rating 2. submission.");


        }

        #[ink::test]
        fn get_ratings() {
            
            let mut market_rep = Mark3tRep::new();

            submit(&mut market_rep, create_rating(PURCHASE1, SELLER1));
            submit(&mut market_rep, create_rating(PURCHASE2, SELLER2));
            submit(&mut market_rep, create_rating(PURCHASE3, SELLER1));

            let all_ratings = market_rep.get_all_seller_ratings();
            all_ratings.iter().for_each(|t| println!("{:?}", t));
            
            assert_eq!(3, all_ratings.len(), "Wrong number of all ratings");

            let ratings_for1 = market_rep.get_all_seller_ratings_for(SELLER1);
            assert_eq!(2, ratings_for1.len(), "Wrong number of ratings for Seller 1");

            let ratings_for2 = market_rep.get_all_seller_ratings_for(SELLER2);
            assert_eq!(1, ratings_for2.len(), "Wrong number of ratings for Seller 2");

        }

        fn create_rating(purchase_id: PurchaseId, seller_id: SellerId) -> SellerRating {
            return SellerRating{purchase_id: purchase_id, timestamp: 1, buyer: BUYER1, seller_id: seller_id, article_id: ARTICLE1, seller_score: 5, article_score: 4, shipping_score: 1, remark: None};
        }


        #[ink::test]
        fn get_transactions() {
            let mut market_rep = Mark3tRep::new();

            submit(&mut market_rep, create_rating(PURCHASE1, SELLER1));
            submit(&mut market_rep, create_rating(PURCHASE2, SELLER2));
            submit(&mut market_rep, create_rating(PURCHASE3, SELLER1));

            assert_eq!(2, market_rep.get_purchases(SELLER1).len());

        }

    }
    */
 
 

}

mod e2e_tests;