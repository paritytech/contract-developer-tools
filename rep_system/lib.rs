#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod rep_system {

    use ink::prelude::vec::Vec;
    use ink::{env::emit_event, storage::{Mapping, StorageVec}};
    use shared::*;

    type RatingKey = (ContextId, TransactionId, EntityType);
    type ScoreKey = (ContextId, EntityId);


    #[ink(storage)]
    pub struct RepSystem {

        // owner of a context to restrict rating submission
        pub owners: Mapping<ContextId, Address>,
        pub calculators: Mapping<ContextId, Address>,

        pub ratings: Mapping<RatingKey, Rating>,
        pub relations: Mapping<(ContextId, EntityType), Vec<EntityType>>,
        pub scores: Mapping<ScoreKey, u8>

    }

    impl RepSystem {

        #[ink(constructor)]
        pub fn new() -> Self {
            Self { 
                owners: Mapping::default(),
                calculators: Mapping::default(),
                ratings: Mapping::default(), 
                relations: Mapping::default(),
                scores: Mapping::default()
            }
        }


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
        pub fn submit_rating(&mut self, context: ContextId, transaction: TransactionId, typ: EntityType, rating: Rating) -> Result<(), Error> {
            self.check_owner(context)?;

            let key: RatingKey = (context, transaction, typ);
            if self.ratings.contains(key) {
                return Err(Error::TransactionAlreadyRated);
            }

            self.ratings.insert(key, &rating); // TODO try_insert
            
            emit_event(RatingSubmitted { 
                context: context, 
                user: rating.0,
                timestamp: rating.2,
                entity_id: rating.1, 
                entity_type: typ, 
                rating: rating.3, 
                remark: rating.4 });

            Ok(())
        }


        #[ink(message)]
        pub fn get_score(&self, context: ContextId, entity: EntityId) -> Score {
            // TODO also checkOwner??
            let key: ScoreKey = (context, entity);

            match self.scores.get(key) {
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

    }



    #[cfg(test)]
    mod tests {
        use ink::{Address, env::address};

        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /**
         * Sample dummy test
         */
        #[ink::test]
        fn it_works() {
            let mut rep_system = RepSystem::new();
            let ctx = 1;
            let ent_id = [42; 32];
            //let owner = Address::from([2; 20]);
            assert_eq!(rep_system.get_score(ctx, ent_id), NO_RATING); 
            rep_system.register_context(ctx);
            assert_eq!(rep_system.get_score(ctx, ent_id), NO_RATING);

        }
    }


    /// This is how you'd write end-to-end (E2E) or integration tests for ink! contracts.
    ///
    /// When running these you need to make sure that you:
    /// - Compile the tests with the `e2e-tests` feature flag enabled (`--features e2e-tests`)
    /// - Are running a Substrate node which contains `pallet-contracts` in the background
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// A helper function used for calling contract messages.
        use ink_e2e::ContractsBackend;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        /// We test that we can read and write a value from the on-chain contract.
        #[ink_e2e::test]
        async fn it_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {

            println!("E2E Test!!!!!!!!!!!!!!!!!");
            // Given
            let mut constructor = RepSystemRef::new();
            let contract = client
                .instantiate("rep_system", &ink_e2e::bob(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<RepSystem>();

            let ctx: u64 = 1;
            /*
             
            let get = call_builder.register_context(ctx);
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), false));
            */

            // When
            let flip = call_builder.get_score(ctx, [1; 32]);
            let _flip_result = client
                .call(&ink_e2e::bob(), &flip)
                .submit()
                .await
                .expect("flip failed");

            // Then
            
            let get = call_builder.get_score(ctx, [1; 32]);
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), 0));

            Ok(())
        }
    }
}

pub use self::rep_system::RepSystem;
