#![cfg_attr(not(feature = "std"), no_std)]

#[derive(Default, Clone)]
#[cfg_attr(
    feature = "std",
    derive(Debug, PartialEq, Eq, ink::storage::traits::StorageLayout)
)]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct RunningAverage {
    sum: u64,
    total: u64,
}

impl RunningAverage {
    pub fn new() -> Self {
        Self::default()
    }

    /// Update the running average with an optional previous value and an optional new value.
    pub fn update(&mut self, prev: Option<u8>, new: Option<u8>) {
        let mut sum = self.sum;
        let mut total = self.total;

        if let Some(p) = prev
            && total != 0
        {
            sum = sum.saturating_sub(u64::from(p));
            total = total.saturating_sub(1);
        }

        if let Some(n) = new {
            sum = sum.saturating_add(u64::from(n));
            total = total.saturating_add(1);
        }

        self.sum = sum;
        self.total = total;
    }

    pub fn n_entries(&self) -> u64 {
        self.total
    }

    pub fn sum(&self) -> u64 {
        self.sum
    }

    /// Returns the current average value.
    ///
    /// Note: Division is required to compute an average. We use saturating_div
    /// which cannot panic, and the zero case is handled explicitly.
    #[allow(clippy::arithmetic_side_effects)]
    pub fn val(&self) -> u8 {
        let total = self.total;
        if total == 0 {
            0
        } else {
            let sum = self.sum;
            let avg = sum.saturating_div(total);
            avg.min(255) as u8
        }
    }
}
