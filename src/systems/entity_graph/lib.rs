#![no_main]
#![no_std]

use dapps_core::{self as _, ContextId, EntityId};

use alloc::string::String;
use pvm::storage::Mapping;
use pvm::caller;
use pvm_contract as pvm;

use parity_scale_codec::{Decode, Encode};

#[derive(Clone, Encode, Decode)]
pub struct Edge {
    pub metadata_uri: String,
}

#[pvm::storage]
struct Storage {
    context_registry: contexts::Reference,
    edges: Mapping<(ContextId, EntityId, EntityId), Edge>,
}

#[pvm::contract(cdm = "@polkadot/entity_graph")]
mod entity_graph {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        let ctx_reg = contexts::cdm_reference();
        Storage::context_registry().set(&ctx_reg);
        Ok(())
    }

    #[pvm::method]
    pub fn add_edge(
        context_id: ContextId,
        parent: EntityId,
        child: EntityId,
        metadata_uri: String,
    ) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }
        Storage::edges().insert(&(context_id, parent, child), &Edge { metadata_uri });
    }

    #[pvm::method]
    pub fn remove_edge(
        context_id: ContextId,
        parent: EntityId,
        child: EntityId,
    ) {
        let ctx_reg = Storage::context_registry().get().expect("not initialized");
        let is_owner = ctx_reg
            .is_owner(context_id, caller())
            .expect("cross-contract call failed");
        if !is_owner {
            return;
        }
        Storage::edges().remove(&(context_id, parent, child));
    }

    #[pvm::method]
    pub fn has_edge(context_id: ContextId, parent: EntityId, child: EntityId) -> bool {
        Storage::edges().contains(&(context_id, parent, child))
    }
}
