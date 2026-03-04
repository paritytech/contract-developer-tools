#![no_std]

pub mod math;

/// Revert the current contract call with an error message.
/// This cleanly reverts all state changes and returns the message to the caller.
pub fn revert(msg: &[u8]) -> ! {
    use pvm_contract::HostFn;
    pvm_contract::api::return_value(pvm_contract::ReturnFlags::REVERT, msg)
}

/// A universally unique identifier (UUID) represented as a 32-byte array.
pub type UUID = [u8; 32];

/// Identifier for any unique entity in the system.
pub type EntityId = UUID;

/// Identifier for a unique context which is owned & controlled by an address.
pub type ContextId = UUID;
