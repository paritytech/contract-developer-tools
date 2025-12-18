#![cfg_attr(not(feature = "std"), no_std)]

use ink::prelude::{string::String};

pub type EntityId = [u8; 32];
pub type ContextId = [u8; 32];

#[derive(Default, Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct RunningAverage {
    sum: u64,
    total: u32,
}

impl RunningAverage {
    pub fn new() -> Self {
        Self::default()
    }

    /// Update the running average with an optional previous value and an optional new value.
    pub fn update(&mut self, prev: Option<u8>, new: Option<u8>) {
        let mut sum = self.sum;
        let mut total = self.total;

        if let Some(p) = prev {
            if total != 0 {
                sum = sum.saturating_sub(p as u64);
                total -= 1;
            }
        }

        if let Some(n) = new {
            sum = sum.saturating_add(n as u64);
            total = total.saturating_add(1);
        }

        self.sum = sum;
        self.total = total;
    }

    pub fn n_entries(&self) -> u32 {
        self.total
    }

    pub fn sum(&self) -> u64 {
        self.sum
    }

    pub fn val(&self) -> u8 {
        if self.total == 0 {
            0
        } else {
            (self.sum / self.total as u64) as u8
        }
    }
}


/*
 * 
 */
#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct ProductReview {
    pub rating: u8,
    pub comment: String,
}

/*
 * 
 */
#[ink::storage_item(packed)]
#[derive(Default, Clone)]
pub struct SellerReview {
    pub rating: u8,
    pub comment: String,
}

/*
 * 
 */
#[derive(Default, Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct ProductMetadata {
    /// Ratings for this product.
    pub average: RunningAverage
}

/*
 * Aggregated data for a seller
 */
#[derive(Default, Clone)]
#[cfg_attr(feature = "std", derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout))]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct SellerMetadata {
    /// Direct seller reviews.
    pub average: RunningAverage,
    /// Per-product averages (only counting products with at least one rating).
    pub product_average: RunningAverage,
}