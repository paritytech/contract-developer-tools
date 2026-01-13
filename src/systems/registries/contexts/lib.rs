#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod context_registry {
    use ink::storage::Mapping;
    use contract_tools::ContextId;

    #[ink(storage)]
    pub struct ContextRegistry {
        /*
         * Mapping of context IDs to their owners.
         * (presumably the owner is a contract, but can be any address)
         */
        pub context_owners: Mapping<ContextId, Address>,
    }

    impl ContextRegistry {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                context_owners: Mapping::default(),
            }
        }

        /**
            Register a new context with the caller as the owner.
         */
        #[ink(message)]
        pub fn register_context(&mut self, context_id: ContextId) {
            let caller: Address = self.env().caller();

            if self.context_owners.get(&context_id).is_some() {
                panic!("Context ID already registered");
            }
            self.context_owners.insert(&context_id, &caller);
        }

        /**
            Get the owner of a context.
         */
        #[ink(message)]
        pub fn get_owner(&self, context_id: ContextId) -> Option<Address> {
            self.context_owners.get(&context_id)
        }

        /**
            Check if an address is the owner of a context.
         */
        #[ink(message)]
        pub fn is_owner(&self, context_id: ContextId, address: Address) -> bool {
            match self.context_owners.get(&context_id) {
                Some(owner) => owner == address,
                None => false,
            }
        }
    }
}
