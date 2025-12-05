#![cfg_attr(not(feature = "std"), no_std, no_main)]


#[ink::contract]
mod market {
    use ink::{storage::Mapping};
    use ink::prelude::vec::Vec;
    // <-- import Vec from ink prelude
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
        /// Recalculate a running average when a rating is inserted or replaced.
        fn updated_average(
            current_average: u64,
            current_total: u32,
            previous_rating: Option<u8>,
            new_rating: u8,
        ) -> (u64, u32) {
            let total_u64 = current_total as u64;
            match previous_rating {
                Some(old) if current_total > 0 => {
                    let sum = current_average
                        .saturating_mul(total_u64)
                        .saturating_sub(old as u64)
                        .saturating_add(new_rating as u64);
                    (sum / total_u64, current_total)
                }
                Some(_) => (new_rating as u64, 1),
                None => {
                    let new_total = total_u64 + 1;
                    let sum = current_average
                        .saturating_mul(total_u64)
                        .saturating_add(new_rating as u64);
                    (sum / new_total, new_total as u32)
                }
            }
        }

        fn update_seller_product_average(
            &mut self,
            seller: SellerId,
            old_product_average: u64,
            old_product_total: u32,
            new_product_average: u64,
        ) {
            let mut seller_meta = self.seller_metadata.get(&seller).unwrap_or_default();
            if old_product_total == 0 {
                let current_products = seller_meta.total_products as u64;
                let new_total_products = current_products + 1;
                let sum = seller_meta
                    .average_product_score
                    .saturating_mul(current_products)
                    .saturating_add(new_product_average);
                seller_meta.average_product_score = sum / new_total_products;
                seller_meta.total_products = new_total_products as u32;
            } else if seller_meta.total_products > 0 {
                let total_products = seller_meta.total_products as u64;
                let sum = seller_meta
                    .average_product_score
                    .saturating_mul(total_products)
                    .saturating_sub(old_product_average)
                    .saturating_add(new_product_average);
                seller_meta.average_product_score = sum / total_products;
            } else {
                seller_meta.average_product_score = new_product_average;
                seller_meta.total_products = 1;
            }
            self.seller_metadata.insert(&seller, &seller_meta);
        }

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
            let previous_review = self.product_reviews.get(&(product, customer));
            let old_product_meta = self.product_metadata.get(&product).unwrap_or_default();

            self.product_reviews.insert(&(product, customer), &review);

            if previous_review.is_none() {
                let mut reviewers = self.product_review_index.get(&product).unwrap_or_default();
                reviewers.push(customer);
                self.product_review_index.insert(&product, &reviewers);
            }

            let (average_score, total_ratings) = Self::updated_average(
                old_product_meta.average_score,
                old_product_meta.total_ratings,
                previous_review.as_ref().map(|r| r.rating),
                review.rating,
            );
            let updated_meta = ProductMetadata {
                average_score,
                total_ratings,
            };
            self.product_metadata.insert(&product, &updated_meta);

            if let Some(seller) = self.product_sellers_index.get(&product) {
                self.update_seller_product_average(
                    seller,
                    old_product_meta.average_score,
                    old_product_meta.total_ratings,
                    updated_meta.average_score,
                );
            }
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
            let previous_review = self.seller_reviews.get(&(seller, customer));
            let existing_meta = self.seller_metadata.get(&seller).unwrap_or_default();

            self.seller_reviews.insert(&(seller, customer), &review);

            let (average_score, total_ratings) = Self::updated_average(
                existing_meta.average_score,
                existing_meta.total_ratings,
                previous_review.as_ref().map(|r| r.rating),
                review.rating,
            );

            let updated_meta = SellerMetadata {
                average_score,
                total_ratings,
                average_product_score: existing_meta.average_product_score,
                total_products: existing_meta.total_products,
            };
            self.seller_metadata.insert(&seller, &updated_meta);
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
            assert_eq!(meta.total_ratings, 1);
            assert_eq!(meta.average_score, 4);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.total_products, 1);
            assert_eq!(seller_meta.average_product_score, 4);
            assert_eq!(seller_meta.total_ratings, 0);
            assert_eq!(seller_meta.average_score, 0);

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
            assert_eq!(meta.total_ratings, 1);
            assert_eq!(meta.average_score, 2);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.total_products, 1);
            assert_eq!(seller_meta.average_product_score, 2);

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
            assert_eq!(meta.total_ratings, 2);
            assert_eq!(meta.average_score, 3);

            let seller_meta = market.get_seller_metadata(seller);
            assert_eq!(seller_meta.total_products, 1);
            assert_eq!(seller_meta.average_product_score, 3);

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
            assert_eq!(meta.total_ratings, 2);
            assert_eq!(meta.average_score, 3);
            assert_eq!(meta.total_products, 0);
            assert_eq!(meta.average_product_score, 0);

            // Update existing review should keep total_ratings constant.
            ink::env::test::set_caller(customer_two);
            market.submit_seller_review(
                seller,
                SellerReview {
                    rating: 3,
                    comment: String::from("better"),
                },
            );

            let updated_meta = market.get_seller_metadata(seller);
            assert_eq!(updated_meta.total_ratings, 2);
            assert_eq!(updated_meta.average_score, 4);
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
