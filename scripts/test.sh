#!/bin/bash
set -e

echo "=== Running unit tests ==="
cargo test --workspace

echo ""
echo "=== Unit tests complete ==="
echo ""
echo "To run integration tests against zombienet:"
echo "  1. Start zombienet: cd ../product-preview-net && zombie-cli spawn -p native bin/local-dev.toml"
echo "  2. Deploy contracts: cd scripts/deploy-ts && bun src/deploy.ts"
echo "  3. Run integration test: CONTRACTS_REGISTRY_ADDR=<addr> bun src/integration-test.ts"
