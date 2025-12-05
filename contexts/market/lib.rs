#![cfg_attr(not(feature = "std"), no_std, no_main)]


#[ink::contract]
mod market {
    use ink::{storage::Mapping};
    use ink::prelude::{vec, vec::Vec, string::String};
    // <-- import Vec from ink prelude
    use shared::{ContextId, EntityId, ProductMetadata, ProductReview, SellerMetadata, SellerReview};
    /// Event emitted when a context is created.
    #[ink(event)]
    pub struct ContextCreated {
        #[ink(topic)]
        from: Option<Address>,
        #[ink(topic)]
        to: Option<Address>,
        #[ink(topic)]
        id: Vec<u8>,
    }

    pub type SellerId = [u8; 32];
    pub type ProductId = [u8; 32];
    pub type CustomerId = Address;

    #[ink(storage)]
    pub struct Market {
        
        /**
         * An individual review for a product by a customer.
         * Each customer can only submit one review per product.
         */
        pub product_reviews: Mapping<(ProductId, CustomerId), ProductReview>,
        
        /**
         * Aggregated metrics for a product
         */
        pub product_metadata: Mapping<ProductId, ProductMetadata>,

        /**
         * An individual review for a seller by a customer.
         * Each customer can only submit one review per seller.
         */
        pub seller_reviews: Mapping<(SellerId, CustomerId), SellerReview>,

        /**
         * Aggregated metrics for a seller 
         * (dependant on both seller & product reviews)
         */
        pub seller_metadata: Mapping<SellerId, SellerMetadata>,

        pub product_sellers_index: Mapping<ProductId, SellerId>,
        pub product_review_index: Mapping<ProductId, Vec<CustomerId>>,
    }

    impl Market {
        /**
         * 
         */
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { 
                product_reviews: Mapping::default(),
                product_metadata: Mapping::default(),
                seller_reviews: Mapping::default(),
                seller_metadata: Mapping::default(),
                product_sellers_index: Mapping::default(),
                product_review_index: Mapping::default(),
            }
        }

        /**
         * 1 - Do whitelisting (skip for now)
         * 2 - Store review (or update review if re-submission)
         * 3 - Update product metadata
         * 4 - Update seller metadata
         * 
         * (make sure to handle the case of a new entry vs. overwrite correctly)
         */
        #[ink(message)]
        pub fn submit_product_review(&mut self, product: ProductId, review: ProductReview) {
            let customer: CustomerId = self.env().caller();
        }

        /**
         * 1 - Do whitelisting (skip for now)
         * 2 - Store review (or update review if re-submission)
         * 4 - Update seller metadata'
         * 
         * (make sure to handle the case of a new entry vs. overwrite correctly)
         */
        #[ink(message)]
        pub fn submit_seller_review(&mut self, seller: SellerId, review: SellerReview) {
            let customer: CustomerId = self.env().caller();
            unimplemented!("submit_seller_review")
        }

        #[ink(message)]
        pub fn get_product_metadata(&self, product: ProductId) -> ProductMetadata {
            ProductMetadata::default()
        }

        #[ink(message)]
        pub fn get_seller_metadata(&self, seller: SellerId) -> SellerMetadata {
            SellerMetadata::default()
        }
    }




    /**
     * 
     * vvv  SAMPLE CONTRACT CODE  vvv
     * 
     */


    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /**
         * Sample dummy test
         */
        #[ink::test]
        fn it_works() {
            let mut market = Market::new();
            assert_eq!(market.get_product_metadata(EntityId::default()), ProductMetadata::default());
            market.submit_product_review(EntityId::default(), ProductReview::default());
            assert_eq!(market.get_product_metadata(EntityId::default()), ProductMetadata::default());
        }
    }


    /// This is how you'd write end-to-end (E2E) or integration tests for ink! contracts.
    ///
    /// When running these you need to make sure that you:
    /// - Compile the tests with the `e2e-tests` feature flag enabled (`--features e2e-tests`)
    /// - Are running a Substrate node which contains `pallet-contracts` in the background
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// A helper function used for calling contract messages.
        use ink_e2e::ContractsBackend;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        /// We test that we can read and write a value from the on-chain contract.
        #[ink_e2e::test]
        async fn it_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Given
            let mut constructor = MarketRef::new(false);
            let contract = client
                .instantiate("market", &ink_e2e::bob(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<Market>();

            let get = call_builder.get();
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), false));

            // When
            let flip = call_builder.flip();
            let _flip_result = client
                .call(&ink_e2e::bob(), &flip)
                .submit()
                .await
                .expect("flip failed");

            // Then
            let get = call_builder.get();
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), true));

            Ok(())
        }
    }
}
