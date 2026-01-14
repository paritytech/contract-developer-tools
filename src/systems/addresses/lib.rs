#![cfg_attr(not(feature = "std"), no_std)]

//! Central address configuration for all system contracts.
//!
//! Addresses are read from `target/.addresses` at compile time.
//! If the file doesn't exist or an address is missing, it defaults to zero.
//!
//! File format (target/.addresses):
//! ```text
//! CONTEXT_REGISTRY=0x1234567890abcdef1234567890abcdef12345678
//! CONTRACT_REGISTRY=0xabcdef1234567890abcdef1234567890abcdef12
//! REPUTATION=0x...
//! DISPUTES=0x...
//! ```

// Include the generated addresses from build.rs
include!(concat!(env!("OUT_DIR"), "/addresses.rs"));
