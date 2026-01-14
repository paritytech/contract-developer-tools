pop build src/systems/registries/contexts
pop build src/systems/registries/contracts
pop build src/systems/reputation
pop build src/systems/disputes

cd examples/reputation-interaction
pnpm papi ink add ../../target/ink/contexts/contexts.contract
pnpm papi ink add ../../target/ink/contracts/contracts.contract
pnpm papi ink add ../../target/ink/reputation/reputation.contract
pnpm papi ink add ../../target/ink/disputes/disputes.contract
