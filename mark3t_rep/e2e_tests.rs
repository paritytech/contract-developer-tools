use super::mark3t_rep::*;
use rep_system::*;
use ink_e2e::ContractsBackend;

type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[ink_e2e::test]
async fn instantiate_with_sufficient_limits<Client: E2EBackend>(
    mut client: Client,
) -> E2EResult<()> {
    // given
    let rep_system = client
        .upload("rep_system", &ink_e2e::alice())
        .submit()
        .await
        .expect("rep_system upload failed");

    const REF_TIME_LIMIT: u64 = 500_000_000_000_000;
    const PROOF_SIZE_LIMIT: u64 = 100_000_000_000;
    // todo remove the last group of `000` to get an `OutOfGas` error in
    // `pallet-revive`. but they should throw an error about `StorageLimitExhausted`.
    let storage_deposit_limit = ink::U256::from(100_000_000_000_000u64);

    let mut constructor = RepSystemRef::new(
        /*
        
        other_contract_code.code_hash,
        REF_TIME_LIMIT,
        PROOF_SIZE_LIMIT,
        storage_deposit_limit,
         */
    );
    let contract = client
        .instantiate("mark3t_rep", &ink_e2e::alice(), &mut constructor)
        .submit()
        .await;

    assert!(contract.is_ok(), "{}", contract.err().unwrap());

    Ok(())
}
