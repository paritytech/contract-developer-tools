# Mark3t Reputation System PoC

### Setup

Install pop cli: `brew install r0gue-io/pop-cli/pop`

Intellisense on code should begin to work after building and the rust-analyzer finishes setting up.

**Build**: `pop build` or `pop build --release`

**Testing**: `pop test`

### Deploy & Test Manually

Currently there is no automated deployment script yet. For local deployment do the following steps:

1. Start an ink node: `pop up ink-node` 
2. Deploy the contracts:
    1. Storage layer: `pop up --path rep_system --constructor new --suri //Alice --url ws://localhost:9944`
    2. Mark3t layer: `pop up --path mark3t_rep --constructor new --args <storage address> --suri //Alice --url ws://localhost:9944`
3. Insert the `mark3t_rep` contract address into `.env`
4. Start the frontend: `pnpm dev`
