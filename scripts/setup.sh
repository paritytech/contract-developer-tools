# Fetch product preview network dependencies
curl -sSL https://raw.githubusercontent.com/paritytech/ppn-proxy/main/install.sh | bash

cd examples/market-api

mkdir -p .papi/descriptors
pnpm install
pnpm papi add -w wss://testnet-passet-hub.polkadot.io passet
