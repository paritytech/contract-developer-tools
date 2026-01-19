#![cfg_attr(not(feature = "std"), no_std)]

pub use addresses;
pub use disputes;
pub use registries;
pub use reputation;

/// Pre-configured contract references using addresses from the `addresses` crate.
/// CI/deployment will replace the zero addresses in `addresses/lib.rs` with real deployed addresses.
#[cfg(feature = "ink-as-dependency")]
pub mod systems {
    use ink::env::call::FromAddr;

    pub mod registries {
        use super::*;

        pub fn contexts() -> crate::registries::contexts::ContextRegistryRef {
            crate::registries::contexts::ContextRegistryRef::from_addr(
                crate::addresses::CONTEXT_REGISTRY,
            )
        }

        pub fn contracts() -> crate::registries::contracts::ContractRegistryRef {
            crate::registries::contracts::ContractRegistryRef::from_addr(
                crate::addresses::CONTRACT_REGISTRY,
            )
        }
    }

    pub fn reputation() -> crate::reputation::ReputationRef {
        crate::reputation::ReputationRef::from_addr(crate::addresses::REPUTATION)
    }

    pub fn disputes() -> crate::disputes::DisputesRef {
        crate::disputes::DisputesRef::from_addr(crate::addresses::DISPUTES)
    }
}
