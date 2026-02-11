#![no_main]
#![no_std]

use dapps_core as _;

use alloc::string::String;
use pvm::caller;
use pvm_contract as pvm;

use dapps::{ContextId, EntityId};

#[pvm::storage]
struct Storage {
    context_id: ContextId,
}

#[pvm::contract]
mod market_api {
    use super::*;

    #[pvm::constructor]
    pub fn new(context_id: ContextId) -> Result<(), Error> {
        // Register this contract as the owner of the context
        let ctx_reg = dapps::registries::contexts::cdm_reference();
        ctx_reg
            .register_context(context_id)
            .expect("context registration failed");

        // Store context ID for runtime use
        Storage::context_id().set(&context_id);

        Ok(())
    }

    /// Forward a user review to the reputation storage layer.
    #[pvm::method]
    pub fn post_review(entity: EntityId, rating: u8, comment_uri: String) {
        if rating == 0 || rating > 5 {
            return;
        }

        let context_id = Storage::context_id().get().expect("not initialized");
        let rep = dapps::reputation::cdm_reference();

        rep.submit_review(context_id, caller(), entity, rating, comment_uri)
            .expect("reputation call failed");
    }
}
