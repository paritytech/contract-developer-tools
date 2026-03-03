#![no_std]

/// A universally unique identifier (UUID) represented as a 32-byte array.
pub type UUID = [u8; 32];

/// Identifier for any unique entity in the system.
pub type EntityId = UUID;

/// Identifier for a unique context which is owned & controlled by an address.
pub type ContextId = UUID;
