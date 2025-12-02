#![cfg_attr(not(feature = "std"), no_std, no_main)]
#[ink::contract]
mod rep_system {
    use ink::{storage::Mapping};
    use shared::{ContextId, EntityId, ReputationContext};

    #[ink(storage)]
    pub struct RepSystem {
        /**
         * TODO! how to get `ReputationContext` to work here? in place of `u8`
         */
        contexts: Vec<u8>,
        
        pub scores: Mapping<EntityId, u64>,
        pub last_updated: Mapping<EntityId, u32>,

    }

    impl RepSystem {
        /**
         * 
         */
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { 
                contexts: vec![], 
                scores: Mapping::default(), 
                last_updated: Mapping::default() 
            }
        }

        /**
         * does this need to exist?
         */
        #[ink(message)]
        pub fn register_calculator(&mut self) {
            self.contexts.push(0);
        }

        /**
         * Create a new reputation context
         */
        #[ink(message)]
        pub fn create_context(&mut self) -> ContextId {
            unimplemented!("create_context")
        }

        /**
         * A user within a context submits a rating
         * - how does this handle aggregation?
         * - do we we 
         *      - store all individual ratings?
         *      - store just base scores and aggregated scores are calculated as queried? or 
         *      - does `submit_rating` cascade updates to dependent scores?
         */
        #[ink(message)]
        pub fn submit_rating(&mut self, context: ContextId) -> () {
            unimplemented!("submit_rating")
        }

        /**
         * Get rating (recursively from heirarchical context)
         */
        #[ink(message)]
        pub fn get_rating(&self, entity: EntityId) -> u64 {
            unimplemented!("get_rating")
        }

        /**
         * Get the `EntityId` associated with an `Address` (user)
         */
        #[ink(message)]
        pub fn get_user_id(&self, user: Address, context: ContextId) -> EntityId {
            unimplemented!("get_user_id")
        }
    }




    /**
     * 
     * vvv  SAMPLE CONTRACT CODE  vvv
     * 
     */


    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /**
         * Sample dummy test
         */
        #[ink::test]
        fn it_works() {
            let mut rep_system = RepSystem::new(false);
            assert_eq!(rep_system.get_rating(EntityId::default()), 0);
            rep_system.create_context();
            assert_eq!(rep_system.get_rating(EntityId::default()), 0);
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
            // Given
            let mut constructor = RepSystemRef::new(false);
            let contract = client
                .instantiate("rep_system", &ink_e2e::bob(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<RepSystem>();

            let get = call_builder.get();
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), false));

            // When
            let flip = call_builder.flip();
            let _flip_result = client
                .call(&ink_e2e::bob(), &flip)
                .submit()
                .await
                .expect("flip failed");

            // Then
            let get = call_builder.get();
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), true));

            Ok(())
        }
    }
}
