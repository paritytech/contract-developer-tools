#![cfg_attr(not(feature = "std"), no_std, no_main)]

//use ink::env::hash::{Keccak256, HashOutput};


#[ink::contract]
mod mark3t_rep {
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

    use shared::{ContextId, EntityId, EntityType, Error, NO_ENTITY, Person, Score};
    use rep_system::RepSystemRef;
    use shared::NO_RATING;


    type PurchaseId = shared::TransactionId;
    type SellerId = EntityId;
    type BuyerId = EntityId;

    const CONTEXT: ContextId = 1;

    const TYPE_SELLER: EntityType = 2;    
    const TYPE_ARTICLE: EntityType = 3;
    const TYPE_SHIPPING: EntityType = 4;

    const TYPE_BUYER: EntityType = 5;

    #[ink(storage)]
    pub struct Mark3tRep {
        rep_system: RepSystemRef
    }

    impl Mark3tRep {

        #[ink(constructor)]
        pub fn new(rep_system_address: ink::Address) -> Self {
            let rep_system = RepSystemRef::new()
            .code_hash(rep_system_address.into())
            /*

                .endowment(0.into())
                .salt_bytes(Some([1u8; 32]))
                .ref_time_limit(ref_time_limit)
                .proof_size_limit(proof_size_limit)
                .storage_deposit_limit(storage_deposit_limit)
                             */
                .instantiate();
            
            let instance = Self { rep_system };

            //instance.rep_system.register_context(CONTEXT); // toggle context creation by contructor flag ?
            instance
        }


        #[ink(message)]
        pub fn submit_seller_rating(&mut self, 
            purchase_id: PurchaseId, 
            buyer: Person,
            seller_id: SellerId,
            article_id: EntityId,
            seller_score: Score, 
            article_score: Score, 
            shipping_score: Score, 
            remark: Option<String>) -> Result<(), Error> {
            

                let timestamp = self.env().block_timestamp();

                let _ = self.rep_system.submit_rating(CONTEXT, purchase_id, TYPE_ARTICLE, (buyer, article_id, timestamp, article_score, None));
                let _ = self.rep_system.submit_rating(CONTEXT, purchase_id, TYPE_SHIPPING, (buyer, NO_ENTITY, timestamp, shipping_score, None));
                let _ = self.rep_system.submit_rating(CONTEXT, purchase_id, TYPE_SELLER, (buyer, seller_id, timestamp, seller_score, remark));

                Ok(())

        }

        #[ink(message)]
        pub fn get_seller_rating(&self, seller_id: SellerId) -> Score {
            self.rep_system.get_score(CONTEXT, seller_id)
        }


    }
    /* 

    #[cfg(test)]
    mod tests {
        use ink::{Address, env::address};
        use rep_system::RepSystem;

        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /**
         * Sample dummy test
         */
        #[ink::test]
        fn it_works() {

            let mut rep_system = RepSystem::new();
            let mut market_rep = Mark3tRep::new(rep_system);
            let ctx = 1;
            let ent_id = [42; 32];
            let owner = Address::from([2; 20]);
            assert_eq!(rep_system.get_score(ctx, ent_id), NO_RATING.into()); 
            rep_system.register_context(ctx);
            assert_eq!(rep_system.get_score(ctx, ent_id), 0);

        }
    }
    */

}

#[cfg(all(test, feature = "e2e-tests"))]
mod e2e_tests;
