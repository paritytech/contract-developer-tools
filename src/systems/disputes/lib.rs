#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::{Address, prelude::string::String};
use contract_tools::EntityId;

#[derive(Default, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "std", derive(Debug, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum DisputeStatus {
    #[default]
    Open,
    Resolved,
    Dismissed,
}

#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct Dispute {
    pub id: EntityId,            // Unique dispute identifier (EntityId)
    pub claimant: Address,       // Who raised the dispute
    pub against: EntityId,       // What entity the dispute is against (EntityId)
    pub claim_uri: String,       // IPFS URI with claim details
    pub status: DisputeStatus,
    pub resolution_uri: Option<String>, // Judgment details if resolved
}

#[ink::contract]
mod disputes {
    use ink::storage::Mapping;
    use ink::env::call::FromAddr;
    use contract_tools::{ContextId, EntityId};
    use registries::contexts::ContextRegistryRef;
    use super::*;

    #[ink(storage)]
    pub struct Disputes {
        /*
         * Reference to the deployed context registry contract
         */
        pub context_registry: ContextRegistryRef,

        /*
         * Store all disputes across all contexts, keyed by (context_id, dispute_id)
         */
        pub disputes: Mapping<(ContextId, EntityId), Dispute>,
    }

    impl Disputes {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                context_registry: ContextRegistryRef::from_addr(addresses::CONTEXT_REGISTRY),
                disputes: Mapping::default(),
            }
        }

        /**
            Open a new dispute within a context. Only the context owner can open disputes.
         */
        #[ink(message)]
        pub fn open_dispute(
            &mut self,
            context_id: ContextId,
            dispute_id: EntityId,
            claimant: Address,
            against: EntityId,
            claim_uri: String,
        ) {
            let caller: Address = self.env().caller();

            if !self.context_registry.is_owner(context_id, caller) {
                panic!("Only context owner can open disputes");
            }

            if self.disputes.get(&(context_id, dispute_id)).is_some() {
                panic!("Dispute ID already exists in this context");
            }

            let dispute = Dispute {
                id: dispute_id,
                claimant,
                against,
                claim_uri,
                status: DisputeStatus::Open,
                resolution_uri: None,
            };

            self.disputes.insert(&(context_id, dispute_id), &dispute);
        }

        /**
            Provide judgment on a dispute. Only the context owner can provide judgment.
         */
        #[ink(message)]
        pub fn provide_judgment(
            &mut self,
            context_id: ContextId,
            dispute_id: EntityId,
            status: DisputeStatus,
            resolution_uri: String,
        ) {
            let caller: Address = self.env().caller();

            if !self.context_registry.is_owner(context_id, caller) {
                panic!("Only context owner can provide judgment");
            }

            let mut dispute = self.disputes.get(&(context_id, dispute_id))
                .expect("Dispute not found");

            if dispute.status != DisputeStatus::Open {
                panic!("Dispute is not open");
            }

            dispute.status = status;
            dispute.resolution_uri = Some(resolution_uri);

            self.disputes.insert(&(context_id, dispute_id), &dispute);
        }

        /**
            Get a dispute by context and dispute ID.
         */
        #[ink(message)]
        pub fn get_dispute(&self, context_id: ContextId, dispute_id: EntityId) -> Option<Dispute> {
            self.disputes.get(&(context_id, dispute_id))
        }
    }
}
