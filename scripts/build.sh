pop build src/systems/contract_registry
pop build src/systems/reputation

cd examples/reputation-interaction
pnpm papi ink add ../../target/ink/contract_registry/contract_registry.contract
pnpm papi ink add ../../target/ink/reputation/reputation.contract
