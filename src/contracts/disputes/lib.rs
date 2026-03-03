#![no_main]
#![no_std]

use alloc::string::String;
use common::{ContextId, EntityId};
use pvm::storage::Mapping;
use pvm::{Address, caller};
use pvm_contract as pvm;

use parity_scale_codec::{Decode, Encode};

#[derive(Clone, Encode, Decode)]
pub struct Dispute {
    pub id: EntityId,
    pub claimant: Address,
    pub against: EntityId,
    pub claim_uri: String,
    pub status: u8,
    pub resolution_uri: String,
}

#[pvm::storage]
struct Storage {
    context_registry: contexts::Reference,
    disputes: Mapping<(ContextId, EntityId), Dispute>,
}

#[pvm::contract(cdm = "@polkadot/disputes")]
mod disputes {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        let ctx_reg = contexts::cdm_reference();
        Storage::context_registry().set(&ctx_reg);
        Ok(())
    }

    #[pvm::method]
    pub fn open_dispute(
        context_id: ContextId,
        dispute_id: EntityId,
        claimant: Address,
        against: EntityId,
        claim_uri: String,
    ) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }

        if Storage::disputes().contains(&(context_id, dispute_id)) {
            return;
        }

        let dispute = Dispute {
            id: dispute_id,
            claimant,
            against,
            claim_uri,
            status: 0, // Open
            resolution_uri: String::new(),
        };

        Storage::disputes().insert(&(context_id, dispute_id), &dispute);
    }

    #[pvm::method]
    pub fn delete_dispute(context_id: ContextId, dispute_id: EntityId) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }

        if let Some(dispute) = Storage::disputes().get(&(context_id, dispute_id)) {
            if dispute.status == 2 {
                // Only delete dismissed disputes
                Storage::disputes().remove(&(context_id, dispute_id));
            }
        }
    }

    #[pvm::method]
    pub fn provide_judgment(
        context_id: ContextId,
        dispute_id: EntityId,
        status: u8,
        resolution_uri: String,
    ) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }

        if let Some(mut dispute) = Storage::disputes().get(&(context_id, dispute_id)) {
            if dispute.status != 0 {
                return; // Only open disputes can be judged
            }
            if status != 1 && status != 2 {
                return; // Invalid status
            }
            dispute.status = status;
            dispute.resolution_uri = resolution_uri;
            Storage::disputes().insert(&(context_id, dispute_id), &dispute);
        }
    }

    #[pvm::method]
    pub fn get_dispute_status(context_id: ContextId, dispute_id: EntityId) -> u8 {
        Storage::disputes()
            .get(&(context_id, dispute_id))
            .map(|d| d.status)
            .unwrap_or(255) // 255 = not found
    }
}
