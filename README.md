# contract-developer-tools

### Setup

Install pop cli: `brew install r0gue-io/pop-cli/pop`

Intellisense on code should begin to work after building and the rust-analyzer finishes setting up.

**Build**: `pop build` or `pop build --release`

**Testing**: `pop test`

### Deploy & Test Manually

#### Setting up test client

Deploy to Paseo with `bash ./scripts/set-deploy.sh`

In `test_client` directory:

update `contractAddr` in `index.ts`

```
pnpm papi ink add ../target/ink/rep_system/rep_system.contract
pnpm papi add -w wss://testnet-passet-hub.polkadot.io passet

bun index.ts
```
