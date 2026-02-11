#![no_main]
#![no_std]

use dapps_core::{self as _, ContextId};

use pvm::storage::Mapping;
use pvm::{Address, caller};
use pvm_contract as pvm;

#[pvm::storage]
struct Storage {
    context_owners: Mapping<ContextId, Address>,
}

#[pvm::contract(cdm = "@polkadot/contexts")]
mod context_registry {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        Ok(())
    }

    #[pvm::method]
    pub fn register_context(context_id: ContextId) {
        if !Storage::context_owners().contains(&context_id) {
            Storage::context_owners().insert(&context_id, &caller());
        }
    }

    #[pvm::method]
    pub fn get_owner(context_id: ContextId) -> Address {
        Storage::context_owners()
            .get(&context_id)
            .unwrap_or_default()
    }

    #[pvm::method]
    pub fn is_owner(context_id: ContextId, address: Address) -> bool {
        Storage::context_owners()
            .get(&context_id)
            .map(|owner| owner == address)
            .unwrap_or(false)
    }
}
