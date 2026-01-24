#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::prelude::string::String;
use ink::prelude::vec::Vec;

/// A simple item with a name and count
#[ink::storage_item(packed)]
#[derive(Default, Clone)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Item {
    pub name: String,
    pub count: u32,
}

#[ink::contract]
mod item_tracker {
    use super::*;
    use dapps::registries::{self, contexts::ContextRegistryRef};
    use dapps::ContextId;
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct ItemTracker {
        /// Reference to context registry
        context_registry: ContextRegistryRef,
        /// Our context ID
        context_id: ContextId,
        /// Items stored by ID (simple incrementing counter)
        items: Mapping<u32, Item>,
        /// Next item ID
        next_id: u32,
        /// Track all item IDs for enumeration
        all_ids: Vec<u32>,
    }

    #[ink(event)]
    pub struct ItemCreated {
        #[ink(topic)]
        id: u32,
        name: String,
    }

    #[ink(event)]
    pub struct ItemUpdated {
        #[ink(topic)]
        id: u32,
        new_count: u32,
    }

    impl ItemTracker {
        #[ink(constructor)]
        pub fn new(context_id: ContextId) -> Self {
            // Register ourselves as context owner
            let mut context_registry = registries::contexts::reference();
            context_registry.register_context(context_id);
            Self {
                context_registry,
                context_id,
                items: Mapping::default(),
                next_id: 1,
                all_ids: Vec::new(),
            }
        }

        /// Create a new item with the given name, returns the item ID
        #[ink(message)]
        pub fn create_item(&mut self, name: String) -> u32 {
            let id = self.next_id;
            self.next_id += 1;

            let item = Item {
                name: name.clone(),
                count: 0,
            };
            self.items.insert(id, &item);
            self.all_ids.push(id);

            self.env().emit_event(ItemCreated { id, name });
            id
        }

        /// Increment an item's count
        #[ink(message)]
        pub fn increment(&mut self, id: u32) {
            if let Some(mut item) = self.items.get(id) {
                item.count = item.count.saturating_add(1);
                self.items.insert(id, &item);
                self.env().emit_event(ItemUpdated {
                    id,
                    new_count: item.count,
                });
            } else {
                panic!("Item not found");
            }
        }

        /// Decrement an item's count
        #[ink(message)]
        pub fn decrement(&mut self, id: u32) {
            if let Some(mut item) = self.items.get(id) {
                item.count = item.count.saturating_sub(1);
                self.items.insert(id, &item);
                self.env().emit_event(ItemUpdated {
                    id,
                    new_count: item.count,
                });
            } else {
                panic!("Item not found");
            }
        }

        /// Delete an item
        #[ink(message)]
        pub fn delete_item(&mut self, id: u32) {
            if self.items.get(id).is_some() {
                self.items.remove(id);
                self.all_ids.retain(|&x| x != id);
            } else {
                panic!("Item not found");
            }
        }

        /// Get a single item by ID
        #[ink(message)]
        pub fn get_item(&self, id: u32) -> Option<Item> {
            self.items.get(id)
        }

        /// Get all item IDs
        #[ink(message)]
        pub fn get_all_ids(&self) -> Vec<u32> {
            self.all_ids.clone()
        }

        /// Get total number of items
        #[ink(message)]
        pub fn total_items(&self) -> u32 {
            self.all_ids.len() as u32
        }

        /// Get our context ID
        #[ink(message)]
        pub fn context_id(&self) -> ContextId {
            self.context_id
        }
    }
}
