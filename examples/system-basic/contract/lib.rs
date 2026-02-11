#![no_main]
#![no_std]

use dapps_core as _;

use alloc::string::String;
use pvm::storage::Mapping;
use pvm_contract as pvm;

use dapps::ContextId;
use parity_scale_codec::{Decode, Encode};

#[derive(Default, Clone, Encode, Decode, pvm::SolAbi)]
pub struct Item {
    pub name: String,
    pub count: u32,
}

#[pvm::storage]
struct Storage {
    context_id: ContextId,
    items: Mapping<u32, Item>,
    next_id: u32,
    total_items: u32,
}

#[pvm::contract]
mod item_tracker {
    use super::*;

    #[pvm::constructor]
    pub fn new(context_id: ContextId) -> Result<(), Error> {
        // Register ourselves as context owner
        let ctx_reg = dapps::registries::contexts::cdm_reference();
        ctx_reg.register_context(context_id).expect("context registration failed");

        Storage::context_id().set(&context_id);
        Storage::next_id().set(&1u32);
        Storage::total_items().set(&0u32);

        Ok(())
    }

    /// Create a new item with the given name, returns the item ID
    #[pvm::method]
    pub fn create_item(name: String) -> u32 {
        let id = Storage::next_id().get().unwrap_or(1);
        Storage::next_id().set(&(id + 1));

        let item = Item { name, count: 0 };
        Storage::items().insert(&id, &item);

        let total = Storage::total_items().get().unwrap_or(0);
        Storage::total_items().set(&(total + 1));

        id
    }

    /// Increment an item's count
    #[pvm::method]
    pub fn increment(id: u32) {
        if let Some(mut item) = Storage::items().get(&id) {
            item.count = item.count.saturating_add(1);
            Storage::items().insert(&id, &item);
        }
    }

    /// Decrement an item's count
    #[pvm::method]
    pub fn decrement(id: u32) {
        if let Some(mut item) = Storage::items().get(&id) {
            item.count = item.count.saturating_sub(1);
            Storage::items().insert(&id, &item);
        }
    }

    /// Delete an item
    #[pvm::method]
    pub fn delete_item(id: u32) {
        if Storage::items().contains(&id) {
            Storage::items().remove(&id);
            let total = Storage::total_items().get().unwrap_or(0);
            Storage::total_items().set(&total.saturating_sub(1));
        }
    }

    /// Get a single item by ID
    #[pvm::method]
    pub fn get_item(id: u32) -> Item {
        Storage::items().get(&id).unwrap_or_default()
    }

    /// Get total number of items
    #[pvm::method]
    pub fn total_items() -> u32 {
        Storage::total_items().get().unwrap_or(0)
    }

    /// Get our context ID
    #[pvm::method]
    pub fn context_id() -> ContextId {
        Storage::context_id().get().unwrap_or([0u8; 32])
    }
}
