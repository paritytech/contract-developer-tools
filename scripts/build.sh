# Build contracts using cargo-contract (not pop, due to target spec bug in pop 0.12.1)
(cd src/systems/registries/contexts && cargo contract build)
(cd src/systems/registries/contracts && cargo contract build)
(cd src/systems/reputation && cargo contract build)
(cd src/systems/disputes && cargo contract build)
(cd src/systems/entity_graph && cargo contract build)

cd examples/market-api
pnpm papi ink add ../../target/ink/contexts/contexts.contract
pnpm papi ink add ../../target/ink/contracts/contracts.contract
pnpm papi ink add ../../target/ink/reputation/reputation.contract
pnpm papi ink add ../../target/ink/disputes/disputes.contract
