#![no_main]
#![no_std]

use common::{ContextId, revert};
use pvm::storage::Mapping;
use pvm::{Address, caller};
use pvm_contract as pvm;

#[pvm::storage]
struct Storage {
    context_owner: Mapping<ContextId, Address>,
    context_operators: Mapping<(ContextId, Address), ()>,
}

#[pvm::contract(cdm = "@polkadot/contexts")]
mod contexts {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        Ok(())
    }

    #[pvm::method]
    pub fn register_context(context_id: ContextId, owner: Address, operator: Address) {
        if !Storage::context_owner().contains(&context_id) {
            Storage::context_owner().insert(&context_id, &owner);
            Storage::context_operators().insert(&(context_id, operator), &());
        }
    }

    #[pvm::method]
    pub fn add_operators(context_id: ContextId, operators: Vec<Address>) {
        require_owner(context_id);
        for op in operators {
            Storage::context_operators().insert(&(context_id, op), &());
        }
    }

    #[pvm::method]
    pub fn remove_operators(context_id: ContextId, operators: Vec<Address>) {
        require_owner(context_id);
        for op in operators {
            Storage::context_operators().remove(&(context_id, op));
        }
    }

    #[pvm::method]
    pub fn transfer_owner(context_id: ContextId, new_owner: Address) {
        require_owner(context_id);
        Storage::context_owner().insert(&context_id, &new_owner);
    }

    #[pvm::method]
    pub fn get_owner(context_id: ContextId) -> Address {
        Storage::context_owner()
            .get(&context_id)
            .unwrap_or_default()
    }

    // Returns true when `address` is the owner of `context_id` or an approved operator.
    // Preferred for new code.
    #[pvm::method]
    pub fn is_authorized(context_id: ContextId, address: Address) -> bool {
        if Storage::context_owner().get(&context_id) == Some(address) {
            return true;
        }
        Storage::context_operators().contains(&(context_id, address))
    }

    // Back-compat alias for `is_authorized`. New consumers should prefer
    // `is_authorized`.
    #[pvm::method]
    pub fn is_owner(context_id: ContextId, address: Address) -> bool {
        is_authorized(context_id, address)
    }

    fn require_owner(context_id: ContextId) {
        let owner = Storage::context_owner()
            .get(&context_id)
            .unwrap_or_default();
        if owner != caller() {
            revert(b"NotOwner");
        }
    }
}
