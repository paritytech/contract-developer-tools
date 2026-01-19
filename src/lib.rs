#![cfg_attr(not(feature = "std"), no_std)]

// Re-export core types at root level
pub use dapps_core::{ContextId, EntityId, UUID};

// Re-export math module
pub use dapps_core::math;

// Re-export systems module with pre-configured contract references
// This is a wrapper that ensures proper namespacing
#[cfg(feature = "ink-as-dependency")]
pub mod systems {
    pub use ::systems::systems::*;
}

// Also expose raw contract modules for type access (crates with types like Review, Dispute, etc.)
// Use absolute paths since we have a local `systems` module above
pub use ::systems::disputes;
pub use ::systems::registries;
pub use ::systems::reputation;
