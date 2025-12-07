import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import * as SPECS from "polkadot-api/chains";
import { start } from "polkadot-api/smoldot";
import { contracts } from "@polkadot-api/descriptors";
import { FixedSizeBinary } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider";

import { getSigner } from "./signer";

await cryptoWaitReady();

const ALICE = getSigner("Alice");
const contractAddr = "0x5fccf241ebd6701ab4596b2f5ef41dc41bdbd1ac";

// if interested, check out how to create a smoldot instance in a WebWorker
// http://papi.how/providers/sm#webworker
const smoldot = start();
const relay = await smoldot.addChain({ chainSpec: SPECS.paseo });
const chain = await smoldot.addChain({
    chainSpec: SPECS.paseo_asset_hub,
    potentialRelayChains: [relay],
});

// Connect to the paseo_asset_hub relay chain.
// const client = createClient(getSmProvider(chain));

const client = createClient(
    withPolkadotSdkCompat(getWsProvider("wss://testnet-passet-hub.polkadot.io"))
);

const inkSdk = createInkSdk(client);
const flipperContract = inkSdk.getContract(contracts.rep_system, contractAddr);

const result = await flipperContract
    .send("create_context", {
        origin: ALICE.address,
        // data: {
        //     entity: new FixedSizeBinary(Uint8Array.from(Array(32).fill(1))),
        // },
    })
    .signAndSubmit(ALICE.signer);

const storage = await flipperContract.getStorage().getRoot();
if (storage.success) {
    storage.value.contexts;
}

console.log("create_context result:", result);
console.log(result.dispatchError);
// const result2 = await flipperContract.query("get_rating", {
//     origin: ALICE.address,
//     data: {
//         entity: new FixedSizeBinary(Uint8Array.from(Array(32).fill(1))),
//     },
// });

// With the `client`, you can get information such as subscribing to the last
// block to get the latest hash:
// client.finalizedBlock$.subscribe((finalizedBlock) =>
//     console.log(finalizedBlock.number, finalizedBlock.hash)
// );

// // To interact with the chain, you need to get the `TypedApi`, which includes
// // all the types for every call in that chain:
// const dotApi = client.getTypedApi(polkadot);

// // get the value for an account
// const accountInfo = await dotApi.query.System.Account.getValue(
//     "16JGzEsi8gcySKjpmxHVrkLTHdFHodRepEz8n244gNZpr9J"
// );
