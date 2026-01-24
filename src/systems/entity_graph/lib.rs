#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::prelude::string::String;

/// Represents an edge (parent-child relationship) between two entities.
#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct Edge {
    /// Optional URI with metadata about this relationship
    pub metadata_uri: Option<String>,
}

#[cdm_macro::cdm("@polkadot/entity_graph")]
#[ink::contract]
mod entity_graph {
    use super::*;
    use dapps_core::{ContextId, EntityId};
    use ink::storage::Mapping;
    use registries::contexts::ContextRegistryRef;

    #[ink(storage)]
    pub struct EntityGraph {
        /*
         * Reference to the deployed context registry contract
         */
        pub context_registry: ContextRegistryRef,

        /*
         * Store all edges across all contexts.
         * Key: (context_id, parent_entity, child_entity)
         * Value: Edge metadata
         */
        pub edges: Mapping<(ContextId, EntityId, EntityId), Edge>,
    }

    impl EntityGraph {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                context_registry: registries::contexts::reference(),
                edges: Mapping::default(),
            }
        }

        /// Add an edge (parent-child relationship) between two entities.
        /// Only the context owner can add edges.
        #[ink(message)]
        pub fn add_edge(
            &mut self,
            context_id: ContextId,
            parent: EntityId,
            child: EntityId,
            metadata_uri: Option<String>,
        ) {
            let caller: Address = self.env().caller();

            if !self.context_registry.is_owner(context_id, caller) {
                panic!("Only context owner can add edges");
            }

            let edge = Edge { metadata_uri };
            self.edges.insert(&(context_id, parent, child), &edge);
        }

        /// Remove an edge between two entities.
        /// Only the context owner can remove edges.
        #[ink(message)]
        pub fn remove_edge(&mut self, context_id: ContextId, parent: EntityId, child: EntityId) {
            let caller: Address = self.env().caller();

            if !self.context_registry.is_owner(context_id, caller) {
                panic!("Only context owner can remove edges");
            }

            self.edges.remove(&(context_id, parent, child));
        }

        /// Check if an edge exists between two entities.
        #[ink(message)]
        pub fn has_edge(&self, context_id: ContextId, parent: EntityId, child: EntityId) -> bool {
            self.edges.contains(&(context_id, parent, child))
        }

        /// Get an edge between two entities, if it exists.
        #[ink(message)]
        pub fn get_edge(
            &self,
            context_id: ContextId,
            parent: EntityId,
            child: EntityId,
        ) -> Option<Edge> {
            self.edges.get(&(context_id, parent, child))
        }
    }
}
