#![cfg_attr(not(feature = "std"), no_std)]

//! Central address configuration for all system contracts.
//! CI/deployment will replace these zero addresses with real deployed addresses.

use ink::Address;

pub const CONTEXT_REGISTRY: Address = Address::zero();
pub const CONTRACT_REGISTRY: Address = Address::zero();

pub const REPUTATION: Address = Address::zero();
pub const DISPUTES: Address = Address::zero();