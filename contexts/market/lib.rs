#![cfg_attr(not(feature = "std"), no_std, no_main)]


#[ink::contract]
mod market {
    use ink::{storage::Mapping};
    use ink::prelude::vec::Vec;
    use shared::{ProductMetadata, ProductReview, SellerMetadata, SellerReview};
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
        
        /*
         * An individual review for a product by a customer.
         * Each customer can only submit one review per product.
         */
        pub product_reviews: Mapping<(ProductId, CustomerId), ProductReview>,
        
        /*
         * Aggregated metrics for a product
         */
        pub product_metadata: Mapping<ProductId, ProductMetadata>,

        /*
         * An individual review for a seller by a customer.
         * Each customer can only submit one review per seller.
         */
        pub seller_reviews: Mapping<(SellerId, CustomerId), SellerReview>,

        /*
         * Aggregated metrics for a seller 
         * (dependant on both seller & product reviews)
         */
        pub seller_metadata: Mapping<SellerId, SellerMetadata>,

        pub product_sellers_index: Mapping<ProductId, SellerId>,
        pub product_review_index: Mapping<ProductId, Vec<CustomerId>>,
    }

    impl Market {

        /*
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

        /*
         * 1 - Do whitelisting (skip for now)
         * 2 - Store review (or update review if re-submission)
         * 3 - Update product metadata
         * 4 - Update seller metadata
         * 
         * (make sure to handle the case of a new entry vs. overwrite correctly)
         */
        #[ink(message)]
        pub fn submit_product_review(&mut self, product_id: ProductId, review: ProductReview) {
            let customer: CustomerId = self.env().caller();

            // TODO! do whitelisting:
            // - check if customer is human
            // - check if customer has purchased product

            // Fetch previously stored values (if any)
            let previous_review = self.product_reviews.get(&(product_id, customer));
            let old_product_meta = self.product_metadata.get(&product_id).unwrap_or_default();

            // Store new product review
            self.product_reviews.insert(&(product_id, customer), &review);

            // Maintain reviewer index
            if previous_review.is_none() {
                let mut reviewers = self.product_review_index.get(&product_id).unwrap_or_default();
                reviewers.push(customer);
                self.product_review_index.insert(&product_id, &reviewers);
            }

            // Update product aggregate
            let mut product_avg = old_product_meta.average.clone();
            product_avg.update_u8(
                previous_review.as_ref().map(|r| r.rating),
                Some(review.rating),
            );

            let updated_meta = ProductMetadata {
                average: product_avg.clone(),
            };
            self.product_metadata.insert(&product_id, &updated_meta);

            // Update seller product_average if we know the seller
            if let Some(seller) = self.product_sellers_index.get(&product_id) {
                let mut seller_meta = self.seller_metadata.get(&seller).unwrap_or_default();

                let prev_product_val = if old_product_meta.average.n_entries() > 0 {
                    Some(old_product_meta.average.val())
                } else {
                    None
                };

                let new_product_val = if product_avg.n_entries() > 0 {
                    Some(product_avg.val())
                } else {
                    None
                };

                seller_meta
                    .product_average
                    .update_u64(prev_product_val, new_product_val);

                self.seller_metadata.insert(&seller, &seller_meta);
            }
        }

        /*
         * 1 - Do whitelisting (skip for now)
         * 2 - Store review (or update review if re-submission)
         * 4 - Update seller metadata'
         * 
         * (make sure to handle the case of a new entry vs. overwrite correctly)
         */
        #[ink(message)]
        pub fn submit_seller_review(&mut self, seller: SellerId, review: SellerReview) {
            let customer: CustomerId = self.env().caller();

            // TODO! do whitelisting:
            // - check if customer is human
            // - check if customer has purchased some product from this seller

            let previous_review = self.seller_reviews.get(&(seller, customer));

            self.seller_reviews.insert(&(seller, customer), &review);

            let mut existing_meta = self.seller_metadata.get(&seller).unwrap_or_default();

            existing_meta.average.update_u8(
                previous_review.as_ref().map(|r| r.rating),
                Some(review.rating),
            );

            self.seller_metadata.insert(&seller, &existing_meta);
        }

        /**
            Delete a product review by the caller for the given product.
         */
        #[ink(message)]
        pub fn delete_product_review(&mut self, product_id: ProductId) {
            let customer: CustomerId = self.env().caller();

            let previous_review = self.product_reviews.get(&(product_id, customer));
            if previous_review.is_none() {
                return;
            }

            // Remove stored review
            self.product_reviews.remove(&(product_id, customer));

            // Previous product metadata
            let old_product_meta = self.product_metadata.get(&product_id).unwrap_or_default();

            // Update product aggregate
            let mut product_avg = old_product_meta.average.clone();
            product_avg.update_u8(previous_review.as_ref().map(|r| r.rating), None);

            let updated_meta = ProductMetadata {
                average: product_avg.clone(),
            };
            self.product_metadata.insert(&product_id, &updated_meta);

            // Maintain reviewer index
            let mut reviewers = self.product_review_index.get(&product_id).unwrap_or_default();
            reviewers.retain(|c| c != &customer);
            self.product_review_index.insert(&product_id, &reviewers);

            // Update seller product_average if we know the seller
            if let Some(seller) = self.product_sellers_index.get(&product_id) {
                let mut seller_meta = self.seller_metadata.get(&seller).unwrap_or_default();

                let prev_product_val = if old_product_meta.average.n_entries() > 0 {
                    Some(old_product_meta.average.val())
                } else {
                    None
                };

                let new_product_val = if product_avg.n_entries() > 0 {
                    Some(product_avg.val())
                } else {
                    None
                };

                seller_meta
                    .product_average
                    .update_u64(prev_product_val, new_product_val);

                self.seller_metadata.insert(&seller, &seller_meta);
            }
        }

        /**
            Delete a seller review by the caller for the given seller.
         */
        #[ink(message)]
        pub fn delete_seller_review(&mut self, seller: SellerId) {
            let customer: CustomerId = self.env().caller();

            let previous_review = self.seller_reviews.get(&(seller, customer));
            if previous_review.is_none() {
                return;
            }

            self.seller_reviews.remove(&(seller, customer));

            let mut existing_meta = self.seller_metadata.get(&seller).unwrap_or_default();
            existing_meta
                .average
                .update_u8(previous_review.as_ref().map(|r| r.rating), None);

            self.seller_metadata.insert(&seller, &existing_meta);
        }

        #[ink(message)]
        pub fn get_product_metadata(&self, product: ProductId) -> ProductMetadata {
            self.product_metadata.get(&product).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_seller_metadata(&self, seller: SellerId) -> SellerMetadata {
            self.seller_metadata.get(&seller).unwrap_or_default()
        }
    }






    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;
        use shared::RunningAverage;

        #[ink::test]
        fn running_average_add_update_remove_exact() {
            let mut avg = RunningAverage::default();

            // Add 1
            avg.update_u8(None, Some(1));
            assert_eq!(avg.sum(), 1);
            assert_eq!(avg.n_entries(), 1);
            assert_eq!(avg.val(), 1);

            // Add 2
            avg.update_u8(None, Some(2));
            assert_eq!(avg.sum(), 3);
            assert_eq!(avg.n_entries(), 2);
            assert_eq!(avg.val(), 1); // floor(3/2)

            // Update 2 -> 4
            avg.update_u8(Some(2), Some(4));
            assert_eq!(avg.sum(), 5);
            assert_eq!(avg.n_entries(), 2);
            assert_eq!(avg.val(), 2); // floor(5/2)

            // Remove 1
            avg.update_u8(Some(1), None);
            assert_eq!(avg.sum(), 4);
            assert_eq!(avg.n_entries(), 1);
            assert_eq!(avg.val(), 4);
        }

        #[ink::test]
        fn running_average_is_reversible_to_single_value() {
            let mut avg = RunningAverage::default();

            // Add a few values
            avg.update_u8(None, Some(1));
            avg.update_u8(None, Some(2));
            avg.update_u8(None, Some(3));

            // Remove them in arbitrary order
            avg.update_u8(Some(2), None);
            avg.update_u8(Some(1), None);
            avg.update_u8(Some(3), None);

            // Everything removed
            assert_eq!(avg.sum(), 0);
            assert_eq!(avg.n_entries(), 0);
            assert_eq!(avg.val(), 0);

            // Now add just a 5
            avg.update_u8(None, Some(5));

            assert_eq!(avg.sum(), 5);
            assert_eq!(avg.n_entries(), 1);
            assert_eq!(avg.val(), 5);
        }

        #[ink::test]
        fn product_review_updates_metadata_and_index() {
            let mut market = Market::new();
            let product = [1u8; 32];
            let seller = [2u8; 32];
            let customer = Address::from_low_u64_be(1);
            market.product_sellers_index.insert(&product, &seller);

            ink::env::test::set_caller(customer);
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 4,
                    comment: String::from("good"),
                },
            );

            let meta = market.get_product_metadata(product);
            assert_eq!(meta.average.n_entries(), 1);
            assert_eq!(meta.average.sum(), 4);
            assert_eq!(meta.average.val(), 4);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.product_average.n_entries(), 1);
            assert_eq!(seller_meta.product_average.sum(), 4);
            assert_eq!(seller_meta.product_average.val(), 4);

            assert_eq!(seller_meta.average.n_entries(), 0);
            assert_eq!(seller_meta.average.sum(), 0);
            assert_eq!(seller_meta.average.val(), 0);

            let reviewers = market.product_review_index.get(&product).unwrap_or_default();
            assert_eq!(reviewers, vec![customer]);
        }

        #[ink::test]
        fn product_review_overwrite_recalculates() {
            let mut market = Market::new();
            let product = [3u8; 32];
            let seller = [4u8; 32];
            let customer = Address::from_low_u64_be(5);
            market.product_sellers_index.insert(&product, &seller);

            ink::env::test::set_caller(customer);
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 5,
                    comment: String::from("initial"),
                },
            );
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 2,
                    comment: String::from("updated"),
                },
            );

            let meta = market.get_product_metadata(product);
            assert_eq!(meta.average.n_entries(), 1);
            assert_eq!(meta.average.sum(), 2);
            assert_eq!(meta.average.val(), 2);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.product_average.n_entries(), 1);
            assert_eq!(seller_meta.product_average.sum(), 2);
            assert_eq!(seller_meta.product_average.val(), 2);

            let reviewers = market.product_review_index.get(&product).unwrap_or_default();
            assert_eq!(reviewers, vec![customer]);
        }

        #[ink::test]
        fn product_reviews_from_multiple_customers_accumulate() {
            let mut market = Market::new();
            let product = [6u8; 32];
            let seller = [7u8; 32];
            let customer_one = Address::from_low_u64_be(1);
            let customer_two = Address::from_low_u64_be(2);
            market.product_sellers_index.insert(&product, &seller);

            ink::env::test::set_caller(customer_one);
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 4,
                    comment: String::from("great"),
                },
            );

            ink::env::test::set_caller(customer_two);
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 2,
                    comment: String::from("ok"),
                },
            );

            let meta = market.get_product_metadata(product);
            assert_eq!(meta.average.n_entries(), 2);
            assert_eq!(meta.average.sum(), 6);
            assert_eq!(meta.average.val(), 3);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.product_average.n_entries(), 1);
            assert_eq!(seller_meta.product_average.sum(), 3);
            assert_eq!(seller_meta.product_average.val(), 3);

            let reviewers = market.product_review_index.get(&product).unwrap_or_default();
            assert_eq!(reviewers.len(), 2);
            assert!(reviewers.contains(&customer_one));
            assert!(reviewers.contains(&customer_two));
        }

        #[ink::test]
        fn seller_review_insert_and_update() {
            let mut market = Market::new();
            let seller = [8u8; 32];
            let customer_one = Address::from_low_u64_be(11);
            let customer_two = Address::from_low_u64_be(12);

            ink::env::test::set_caller(customer_one);
            market.submit_seller_review(
                seller,
                SellerReview {
                    rating: 5,
                    comment: String::from("excellent"),
                },
            );

            ink::env::test::set_caller(customer_two);
            market.submit_seller_review(
                seller,
                SellerReview {
                    rating: 1,
                    comment: String::from("bad"),
                },
            );

            let meta = market.get_seller_metadata(seller);
            assert_eq!(meta.average.n_entries(), 2);
            assert_eq!(meta.average.sum(), 6);
            assert_eq!(meta.average.val(), 3);
            assert_eq!(meta.product_average.n_entries(), 0);
            assert_eq!(meta.product_average.sum(), 0);
            assert_eq!(meta.product_average.val(), 0);

            // Update existing review should keep n_entries constant.
            ink::env::test::set_caller(customer_two);
            market.submit_seller_review(
                seller,
                SellerReview {
                    rating: 3,
                    comment: String::from("better"),
                },
            );

            let updated_meta = market.get_seller_metadata(seller);
            assert_eq!(updated_meta.average.n_entries(), 2);
            assert_eq!(updated_meta.average.sum(), 8);
            assert_eq!(updated_meta.average.val(), 4);
        }

        #[ink::test]
        fn delete_product_review_updates_metadata_and_index() {
            let mut market = Market::new();
            let product = [9u8; 32];
            let seller = [10u8; 32];
            let customer_one = Address::from_low_u64_be(21);
            let customer_two = Address::from_low_u64_be(22);

            market.product_sellers_index.insert(&product, &seller);

            ink::env::test::set_caller(customer_one);
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 4,
                    comment: String::from("good"),
                },
            );

            ink::env::test::set_caller(customer_two);
            market.submit_product_review(
                product,
                ProductReview {
                    rating: 2,
                    comment: String::from("ok"),
                },
            );

            // Pre-delete
            let meta = market.get_product_metadata(product);
            assert_eq!(meta.average.n_entries(), 2);
            assert_eq!(meta.average.sum(), 6);
            assert_eq!(meta.average.val(), 3);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.product_average.n_entries(), 1);
            assert_eq!(seller_meta.product_average.sum(), 3);
            assert_eq!(seller_meta.product_average.val(), 3);

            // Delete one review
            ink::env::test::set_caller(customer_two);
            market.delete_product_review(product);

            let meta = market.get_product_metadata(product);
            assert_eq!(meta.average.n_entries(), 1);
            assert_eq!(meta.average.sum(), 4);
            assert_eq!(meta.average.val(), 4);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.product_average.n_entries(), 1);
            assert_eq!(seller_meta.product_average.sum(), 4);
            assert_eq!(seller_meta.product_average.val(), 4);

            let reviewers = market.product_review_index.get(&product).unwrap_or_default();
            assert_eq!(reviewers.len(), 1);
            assert_eq!(reviewers[0], customer_one);

            // Delete last review
            ink::env::test::set_caller(customer_one);
            market.delete_product_review(product);

            let meta = market.get_product_metadata(product);
            assert_eq!(meta.average.n_entries(), 0);
            assert_eq!(meta.average.sum(), 0);
            assert_eq!(meta.average.val(), 0);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.product_average.n_entries(), 0);
            assert_eq!(seller_meta.product_average.sum(), 0);
            assert_eq!(seller_meta.product_average.val(), 0);

            let reviewers = market.product_review_index.get(&product).unwrap_or_default();
            assert_eq!(reviewers.len(), 0);
        }

        #[ink::test]
        fn delete_product_review_noop_when_missing() {
            let mut market = Market::new();
            let product = [11u8; 32];
            let customer = Address::from_low_u64_be(30);

            ink::env::test::set_caller(customer);
            // Should not panic
            market.delete_product_review(product);
        }

        #[ink::test]
        fn delete_seller_review_updates_metadata() {
            let mut market = Market::new();
            let seller = [12u8; 32];
            let customer_one = Address::from_low_u64_be(31);
            let customer_two = Address::from_low_u64_be(32);

            ink::env::test::set_caller(customer_one);
            market.submit_seller_review(
                seller,
                SellerReview {
                    rating: 5,
                    comment: String::from("excellent"),
                },
            );

            ink::env::test::set_caller(customer_two);
            market.submit_seller_review(
                seller,
                SellerReview {
                    rating: 1,
                    comment: String::from("bad"),
                },
            );

            let meta = market.get_seller_metadata(seller);
            assert_eq!(meta.average.n_entries(), 2);
            assert_eq!(meta.average.sum(), 6);
            assert_eq!(meta.average.val(), 3);

            // Delete one
            ink::env::test::set_caller(customer_two);
            market.delete_seller_review(seller);

            let meta = market.get_seller_metadata(seller);
            assert_eq!(meta.average.n_entries(), 1);
            assert_eq!(meta.average.sum(), 5);
            assert_eq!(meta.average.val(), 5);

            // Delete remaining
            ink::env::test::set_caller(customer_one);
            market.delete_seller_review(seller);

            let meta = market.get_seller_metadata(seller);
            assert_eq!(meta.average.n_entries(), 0);
            assert_eq!(meta.average.sum(), 0);
            assert_eq!(meta.average.val(), 0);
        }

        #[ink::test]
        fn delete_seller_review_noop_when_missing() {
            let mut market = Market::new();
            let seller = [13u8; 32];
            let customer = Address::from_low_u64_be(40);

            ink::env::test::set_caller(customer);
            // No entry, should be no-op
            market.delete_seller_review(seller);
        }
    }

    /// This is how you'd write end-to-end (E2E) or integration tests for ink! contracts.
    ///
    /// When running these you need to make sure that you:
    /// - Compile the tests with the `e2e-tests` feature flag enabled (`--features e2e-tests`)
    /// - Are running a Substrate node which contains `pallet-contracts` in the background
    /// Basic E2E: deploys the contract and has Bob submit a product review.
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink::prelude::string::String;
        use ink_e2e::ContractsBackend;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn bob_can_submit_product_review(
            mut client: ink_e2e::Client<C, E>,
        ) -> E2EResult<()> {
            // given: deployed Market contract
            let mut constructor = MarketRef::new();
            let contract = client
                .instantiate("market", &ink_e2e::bob(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<Market>();

            let product_id: ProductId = [42u8; 32];
            let review = ProductReview {
                rating: 4,
                comment: String::from("nice product from e2e"),
            };

            // when: Bob submits a review
            let submit = call_builder.submit_product_review(product_id, review);
            client
                .call(&ink_e2e::bob(), &submit)
                .submit()
                .await
                .expect("submit_product_review failed");

            // then: metadata reflects Bob's review
            let get_meta = call_builder.get_product_metadata(product_id);
            let meta_res = client
                .call(&ink_e2e::alice(), &get_meta)
                .dry_run()
                .await
                .expect("get_product_metadata failed");

            let meta = meta_res.return_value();
            assert_eq!(meta.average.n_entries(), 1);
            assert_eq!(meta.average.sum(), 4);
            assert_eq!(meta.average.val(), 4);

            Ok(())
        }
    }
}
