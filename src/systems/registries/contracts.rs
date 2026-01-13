#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::Address;
use ink::env::BlockNumber;
use ink::prelude::{string::String};

pub type Version = u32;

#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct PublishedContract {
    /**
        The block number when this contract version was published
     */
    pub publish_block: BlockNumber,

    /**
        The address of the published contract
     */
    pub address: Address,

    /**
        Bulletin chain IPFS URI pointing to this contract version's metadata
     */
    pub metadata_uri: String,
}

#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct NamedContractInfo {
    /**
        The owner of the contract name
     */
    pub owner: Address,

    /**
        The number of versions published under this contract name.
        `version_count - 1` refers to the latest published version
     */
    pub version_count: Version,
}

#[ink::contract]
mod contract_registry {
    use ink::storage::StorageVec;
    use ink::{storage::Mapping};
    use ink::prelude::{string::String};
    use super::{NamedContractInfo, PublishedContract, Version};

    #[ink(storage)]
    pub struct ContractRegistry {

        /**
            List of all registered contract names, ordered by creation time
         */
        pub contract_names: StorageVec<String>,

        /**
            Stores all published versions of named contracts where the key for
            an individual versioned contract is given by `(contract_name, version)`
         */
        pub published_contract: Mapping<(String, Version), PublishedContract>,

        /**
            Stores info about each registered contract name
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

        /**
            Publish the latest version of a contract registered under name `contract_name`

            The caller only has permission to publish a new version of `contract_name` if
            either the name is available or they are already the owner of the name.
         */
        #[ink(message)]
        pub fn publish_latest(&mut self, contract_name: String, contract_address: Address, metadata_uri: String) {
            let caller = self.env().caller();

            // Get existing info or register new `contract_name` with caller as owner
            let mut info = match self.info.get(&contract_name) {
                Some(info) => info,
                None => {
                    let info = NamedContractInfo {
                        owner: caller,
                        version_count: 0,
                    };
                    self.contract_names.push(&contract_name);
                    info
                }
            };

            // Abort if not owner
            if info.owner != caller {
                return;
            }

            // Increment version count & save info
            info.version_count = info
                .version_count
                .checked_add(1)
                .expect("publish_latest: version_count overflow");
            self.info.insert(&contract_name, &info);

            // Create new `PublishedContract` & insert @ latest idx
            let latest = PublishedContract {
                publish_block: self.env().block_number(),
                address: contract_address,
                metadata_uri,
            };
            self.published_contract.insert(
                &(contract_name, info.version_count.saturating_sub(1)),
                &latest
            );
        }

        /**
            Get the latest `PublishedContract` for a given `contract_name`
         */
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
        use super::*;
        use ink::env::test;

        fn default_accounts() -> test::DefaultAccounts{
            test::default_accounts()
        }

        fn set_caller(caller: Address) {
            test::set_caller(caller);
        }

        #[ink::test]
        fn new_creates_empty_registry() {
            let registry = ContractRegistry::new();
            assert!(registry.get_latest(String::from("nonexistent")).is_none());
        }

        #[ink::test]
        fn publish_latest_registers_new_contract() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut registry = ContractRegistry::new();
            let name = String::from("my_contract");
            let addr = accounts.bob;
            let uri = String::from("ipfs://QmTest123");

            registry.publish_latest(name.clone(), addr, uri.clone());

            let latest = registry.get_latest(name.clone()).expect("contract should exist");
            assert_eq!(latest.address, addr);
            assert_eq!(latest.metadata_uri, uri);

            let info = registry.info.get(&name).expect("info should exist");
            assert_eq!(info.owner, accounts.alice);
            assert_eq!(info.version_count, 1);
        }

        #[ink::test]
        fn publish_latest_increments_version() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut registry = ContractRegistry::new();
            let name = String::from("my_contract");

            // Publish version 0
            registry.publish_latest(
                name.clone(),
                accounts.bob,
                String::from("ipfs://v0"),
            );

            // Publish version 1
            registry.publish_latest(
                name.clone(),
                accounts.charlie,
                String::from("ipfs://v1"),
            );

            // Latest should be version 1
            let latest = registry.get_latest(name.clone()).expect("should exist");
            assert_eq!(latest.address, accounts.charlie);
            assert_eq!(latest.metadata_uri, String::from("ipfs://v1"));

            // Version count should be 2
            let info = registry.info.get(&name).expect("info should exist");
            assert_eq!(info.version_count, 2);

            // Version 0 should still be accessible
            let v0 = registry
                .published_contract
                .get(&(name.clone(), 0))
                .expect("v0 should exist");
            assert_eq!(v0.address, accounts.bob);
            assert_eq!(v0.metadata_uri, String::from("ipfs://v0"));
        }

        #[ink::test]
        fn non_owner_cannot_publish_to_existing_name() {
            let accounts = default_accounts();

            let mut registry = ContractRegistry::new();
            let name = String::from("my_contract");

            // Alice publishes first, becoming owner
            set_caller(accounts.alice);
            registry.publish_latest(
                name.clone(),
                accounts.bob,
                String::from("ipfs://v0"),
            );

            // Bob tries to publish to the same name
            set_caller(accounts.bob);
            registry.publish_latest(
                name.clone(),
                accounts.charlie,
                String::from("ipfs://malicious"),
            );

            // Should still be Alice's version
            let latest = registry.get_latest(name.clone()).expect("should exist");
            assert_eq!(latest.address, accounts.bob);
            assert_eq!(latest.metadata_uri, String::from("ipfs://v0"));

            // Version count should still be 1
            let info = registry.info.get(&name).expect("info should exist");
            assert_eq!(info.owner, accounts.alice);
            assert_eq!(info.version_count, 1);
        }

        #[ink::test]
        fn get_latest_returns_none_for_unknown_name() {
            let registry = ContractRegistry::new();
            assert!(registry.get_latest(String::from("unknown")).is_none());
        }

        #[ink::test]
        fn multiple_contracts_are_independent() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut registry = ContractRegistry::new();

            // Register contract A
            registry.publish_latest(
                String::from("contract_a"),
                accounts.bob,
                String::from("ipfs://a"),
            );

            // Register contract B
            registry.publish_latest(
                String::from("contract_b"),
                accounts.charlie,
                String::from("ipfs://b"),
            );

            // Both should exist independently
            let a = registry.get_latest(String::from("contract_a")).expect("a should exist");
            let b = registry.get_latest(String::from("contract_b")).expect("b should exist");

            assert_eq!(a.address, accounts.bob);
            assert_eq!(b.address, accounts.charlie);
        }

        #[ink::test]
        fn different_owners_can_register_different_names() {
            let accounts = default_accounts();
            let mut registry = ContractRegistry::new();

            // Alice registers contract_a
            set_caller(accounts.alice);
            registry.publish_latest(
                String::from("contract_a"),
                accounts.bob,
                String::from("ipfs://a"),
            );

            // Bob registers contract_b
            set_caller(accounts.bob);
            registry.publish_latest(
                String::from("contract_b"),
                accounts.charlie,
                String::from("ipfs://b"),
            );

            let info_a = registry.info.get(&String::from("contract_a")).unwrap();
            let info_b = registry.info.get(&String::from("contract_b")).unwrap();

            assert_eq!(info_a.owner, accounts.alice);
            assert_eq!(info_b.owner, accounts.bob);
        }

        #[ink::test]
        fn publish_block_is_recorded() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut registry = ContractRegistry::new();
            let name = String::from("my_contract");

            // Advance block number
            test::advance_block::<ink::env::DefaultEnvironment>();
            test::advance_block::<ink::env::DefaultEnvironment>();

            registry.publish_latest(name.clone(), accounts.bob, String::from("ipfs://test"));

            let latest = registry.get_latest(name).expect("should exist");
            // Block number should be current block (2 after advancing twice from 0)
            assert_eq!(latest.publish_block, 2);
        }

        #[ink::test]
        fn contract_names_list_is_populated() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut registry = ContractRegistry::new();

            registry.publish_latest(
                String::from("first"),
                accounts.bob,
                String::from("ipfs://1"),
            );
            registry.publish_latest(
                String::from("second"),
                accounts.bob,
                String::from("ipfs://2"),
            );

            assert_eq!(registry.contract_names.len(), 2);
            assert_eq!(registry.contract_names.get(0), Some(String::from("first")));
            assert_eq!(registry.contract_names.get(1), Some(String::from("second")));
        }

        #[ink::test]
        fn publishing_new_version_does_not_add_duplicate_name() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut registry = ContractRegistry::new();
            let name = String::from("my_contract");

            // Publish twice to same name
            registry.publish_latest(name.clone(), accounts.bob, String::from("ipfs://v0"));
            registry.publish_latest(name.clone(), accounts.charlie, String::from("ipfs://v1"));

            // Should only have one entry in contract_names
            assert_eq!(registry.contract_names.len(), 1);
        }
    }
}
