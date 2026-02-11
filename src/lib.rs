#![no_std]

// Re-export core types at root level
pub use dapps_core::{ContextId, EntityId, UUID};

// Re-export math module
pub use dapps_core::math;

// Re-export contract modules
// Each module has a `reference()` function for CDM-based runtime address lookup
pub use disputes;
pub use entity_graph;
pub use registries;
pub use reputation;
