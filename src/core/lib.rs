#![no_std]

extern crate alloc;

mod allocator;

/// A universally unique identifier (UUID) represented as a 32-byte array.
pub type UUID = [u8; 32];

/// Identifier for any unique *thing* in the system (e.g., user, contract, organization, receipt)
pub type EntityId = UUID;

/// Identifier for a unique context which is owned & controlled by an `address`.
pub type ContextId = UUID;

pub use math;
