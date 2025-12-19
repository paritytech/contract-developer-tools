#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::Address;
use ink::prelude::{string::String};

#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct PublishedContract {
    pub publish_block: u64,
    pub address: Address,
    pub metadata_uri: String,
}

#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct NamedContractInfo {
    pub owner: Address,
    pub version_count: u32,
}

#[ink::contract]
mod contract_registry {
    use ink::storage::StorageVec;
    use ink::{storage::Mapping};
    use ink::prelude::{string::String};

    use crate::{ NamedContractInfo, PublishedContract};

    #[ink(storage)]
    pub struct ContractRegistry {

        /*
         * List of all contract names
         */
        pub contract_names: StorageVec<String>,

        /*
         * Mapping from (contract_name, version index) -> PublishedContract
         */
        pub published_contract: Mapping<(String, u32), PublishedContract>,


        /*
         * Stores info about each registered contract name 
         */
        pub info: Mapping<String, NamedContractInfo>,
    }

    impl ContractRegistry {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { 
                published_contract: Mapping::default(),
                info: Mapping::default(),
                contract_names: StorageVec::new(),
            }
        }

        /*
         *
         */
        #[ink(message)]
        pub fn publish_latest(&mut self, contract_name: String, contract_address: Address, metadata_uri: String) {
            let caller = self.env().caller();
            let publish_block = self.env().block_number() as u64;

            let (version_idx, is_new_name) = match self.info.get(&contract_name) {
                Some(mut info) => {
                    if info.owner != caller {
                        panic!("publish_latest: caller is not owner for this contract_name");
                    }

                    let idx = info.version_count;
                    info.version_count = info
                        .version_count
                        .checked_add(1)
                        .expect("publish_latest: version_count overflow");

                    self.info.insert(&contract_name, &info);
                    (idx, false)
                }
                None => {
                    let info = NamedContractInfo {
                        owner: caller,
                        version_count: 1, // publishing v0 right now
                    };
                    self.info.insert(&contract_name, &info);
                    (0u32, true)
                }
            };

            if is_new_name {
                self.contract_names.push(&contract_name);
            }

            let published = PublishedContract {
                publish_block,
                address: contract_address,
                metadata_uri,
            };

            let key = (contract_name, version_idx);
            self.published_contract.insert(&key, &published);
        }

        #[ink(message)]
        pub fn get_latest(&self, contract_name: String) -> Option<PublishedContract> {
            let info = self.info.get(&contract_name);
            if let Some(info) = info {
                let latest_version = info.version_count.saturating_sub(1);
                self.published_contract.get(&(contract_name, latest_version))
            } else {
                None
            }
        }
    }






    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;
        use contract_tools::RunningAverage;

        #[ink::test]
        fn running_average_add_update_remove_exact() {
            let mut avg = RunningAverage::default();

            // Add 1
            avg.update(None, Some(1));
            assert_eq!(avg.sum(), 1);
            assert_eq!(avg.n_entries(), 1);
            assert_eq!(avg.val(), 1);

            // Add 2
            avg.update(None, Some(2));
            assert_eq!(avg.sum(), 3);
            assert_eq!(avg.n_entries(), 2);
            assert_eq!(avg.val(), 1); // floor(3/2)

            // Update 2 -> 4
            avg.update(Some(2), Some(4));
            assert_eq!(avg.sum(), 5);
            assert_eq!(avg.n_entries(), 2);
            assert_eq!(avg.val(), 2); // floor(5/2)

            // Remove 1
            avg.update(Some(1), None);
            assert_eq!(avg.sum(), 4);
            assert_eq!(avg.n_entries(), 1);
            assert_eq!(avg.val(), 4);
        }

    }

    /// This is how you'd write end-to-end (E2E) or integration tests for ink! contracts.
    ///
    /// When running these you need to make sure that you:
    /// - Compile the tests with the `e2e-tests` feature flag enabled (`--features e2e-tests`)
    /// - Are running a Substrate node which contains `pallet-contracts` in the background
    /// Basic E2E: deploys the contract and has Bob submit a product review.
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink::prelude::string::String;
        use ink_e2e::ContractsBackend;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn bob_can_submit_product_review(
            mut client: ink_e2e::Client<C, E>,
        ) -> E2EResult<()> {
            // given: deployed Market contract
            let mut constructor = ContractRegistryRef::new();
            let contract = client
                .instantiate("contract_registry", &ink_e2e::bob(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<ContractRegistry>();

            let product_id: ProductId = [42u8; 32];
            let review = ProductReview {
                rating: 4,
                comment: String::from("nice product from e2e"),
            };

            // when: Bob submits a review
            let submit = call_builder.submit_product_review(product_id, review);
            client
                .call(&ink_e2e::bob(), &submit)
                .submit()
                .await
                .expect("submit_product_review failed");

            // then: metadata reflects Bob's review
            let get_meta = call_builder.get_product_metadata(product_id);
            let meta_res = client
                .call(&ink_e2e::alice(), &get_meta)
                .dry_run()
                .await
                .expect("get_product_metadata failed");

            let meta = meta_res.return_value();
            assert_eq!(meta.average.n_entries(), 1);
            assert_eq!(meta.average.sum(), 4);
            assert_eq!(meta.average.val(), 4);

            Ok(())
        }
    }
}
