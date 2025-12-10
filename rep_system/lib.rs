#![cfg_attr(not(feature = "std"), no_std, no_main)]
/* 
#[ink::contract]
mod rep_system {

    use ink::prelude::vec::Vec;
    use ink::{env::emit_event, storage::{Mapping, StorageVec}};
    use shared::*;

    type RatingKey = (ContextId, TransactionId, EntityType);
    type ScoreKey = (ContextId, EntityId);


    #[ink(storage)]
    pub struct RepSystem {


    }

    impl RepSystem {

        #[ink(constructor)]
        pub fn new() -> Self {

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

*/