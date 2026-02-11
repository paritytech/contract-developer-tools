#!/bin/bash
set -e

# Build all system contracts using cargo pvm-contract build
CONTRACTS=(contracts contexts reputation disputes entity_graph)

PVM_CONTRACT_BIN="/home/ubuntu/cargo-pvm-contract/target/debug/cargo-pvm-contract"
MANIFEST="/home/ubuntu/contract-developer-tools/Cargo.toml"

echo "Building all system contracts..."
for contract in "${CONTRACTS[@]}"; do
    "$PVM_CONTRACT_BIN" pvm-contract build --manifest-path "$MANIFEST" -p "$contract"
done

echo ""
echo "Build complete."
echo ""
echo "To deploy contracts, use the CDM CLI:"
echo "  cd src/packages/cdm-cli && CONTRACTS_REGISTRY_ADDR=0x... bun run dev deploy ws://localhost:9944"
