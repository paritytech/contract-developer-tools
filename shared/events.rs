#![cfg_attr(not(feature = "std"), no_std, no_main)]
/*

mod events {
    use crate::{ContextId, EntityId, EntityType};
    use ink::Address;
    use ink::env::Timestamp;

    #[ink::event]
    pub struct RatingSubmitted {
        #[ink(topic)]
        context: ContextId,
        #[ink(topic)]
        user: Address,
        entity_id: EntityId,
        entity_type: EntityType,
        rating: u32
    }    

     #[ink::event]
    pub struct ContextCreated {
        #[ink(topic)]
        context: ContextId,
        #[ink(topic)]
        owner: Address,
        time: Timestamp
    }

}

 */
