// test_client/src/index.ts

import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider";
import { contracts } from "@polkadot-api/descriptors";
import { FixedSizeBinary } from "polkadot-api";

import { getSigner } from "./signer";

import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

const PROD_REVIEW_KEYS = ["B6XR", "MM38"];

const MARKET_CONTRACT_ADDR = "0x0b6670b0185b23df080b340fac8948fa2b0e7c62"; // update if you redeploy

function randomCode(len = 4): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}

function shortCodeToId(code: string): FixedSizeBinary<32> {
    const enc = new TextEncoder();
    const bytes = new Uint8Array(32);
    const src = enc.encode(code.slice(0, 32));
    bytes.set(src);
    return new FixedSizeBinary(bytes);
}

await cryptoWaitReady();

const ALICE = getSigner("Alice");

const client = createClient(
    withPolkadotSdkCompat(getWsProvider("wss://testnet-passet-hub.polkadot.io"))
);

const inkSdk = createInkSdk(client);
const market = inkSdk.getContract(contracts.market, MARKET_CONTRACT_ADDR);

const result = await market.query("get_product_metadata", {
    origin: ALICE.address,
    data: {
        product: shortCodeToId("MM38"),
    },
});

console.log("Query executed successfully", result);

const res2 = await market.getStorage().getRoot();

if (!res2.success) {
    console.error("Failed to get contract storage root:", "NONE");
}

if (res2.success) {
    const keyRes = await res2.value.product_review_index(
        shortCodeToId("MM38")
        // FixedSizeBinary.fromText(ALICE.address),
    );

    if (keyRes.success) {
        const key = keyRes.value[0];
        console.log("Found review key:", key.asHex());

        console.log(
            "Contract Storage Data:",
            await res2.value.product_reviews([shortCodeToId("MM38"), key])
        );
    }
}
