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

const MARKET_CONTRACT_ADDR = "0x0b6670b0185b23df080b340fac8948fa2b0e7c62";
function getContract(inkSdk: ReturnType<typeof createInkSdk>) {
    return inkSdk.getContract(contracts.market, MARKET_CONTRACT_ADDR);
}

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

class MarketReputationAPI {
    public signer: ReturnType<typeof getSigner>;
    public market: ReturnType<typeof getContract>;

    constructor() {
        this.signer = getSigner("Alice");
        const client = createClient(
            withPolkadotSdkCompat(
                getWsProvider("wss://testnet-passet-hub.polkadot.io")
            )
        );
        const inkSdk = createInkSdk(client);
        this.market = inkSdk.getContract(
            contracts.market,
            MARKET_CONTRACT_ADDR
        );
    }

    async submitReview(
        kind: "product" | "seller",
        entityId: FixedSizeBinary<32>,
        rating: number,
        comment: string
    ) {
        const msgName =
            kind === "seller"
                ? "submit_seller_review"
                : "submit_product_review";

        const data =
            kind === "seller"
                ? {
                      seller: entityId,
                      review: { rating, comment },
                  }
                : {
                      product_id: entityId,
                      review: { rating, comment },
                  };

        // submit review
        return this.market
            .send(msgName, {
                origin: this.signer.address,
                data,
            })
            .signAndSubmit(this.signer.signer);
    }
}

async function main() {
    await cryptoWaitReady();

    // interface with contract features
    const marketRep = new MarketReputationAPI();

    // Handle user command loop
    const rl = createInterface({ input, output });
    const ask = (q: string) => rl.question(q);
    for (;;) {
        // Fetch input
        const rawInput = (
            await ask(
                "\nReview type: [p]roduct, [s]eller, [q]uit? (default: p) "
            )
        )
            .trim()
            .toLowerCase();
        if (rawInput === "q") {
            break;
        }

        const isSeller = rawInput === "s";
        const label = isSeller ? "Seller" : "Product";

        let code = (
            await ask(`${label} code (4 chars, empty = random): `)
        ).trim();

        if (!code) {
            code = randomCode(4);
            console.log(`${label} code generated: ${code}`);
        } else if (code.length > 4) {
            code = code.slice(0, 4);
            console.log(`${label} code truncated to: ${code}`);
        }

        const id = shortCodeToId(code);

        const ratingStr = (await ask("Rating (1-5): ")).trim();
        const rating = Number(ratingStr);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            console.error("Invalid rating, must be integer 1..5");
            continue;
        }

        const comment = await ask("Comment: ");

        console.log(
            `\nSubmitting ${label.toLowerCase()} review as Alice (${
                marketRep.signer.address
            })...`
        );

        // Submit review TX
        try {
            const result = await marketRep.submitReview(
                isSeller ? "seller" : "product",
                id,
                rating,
                comment
            );

            console.log("Tx result:");
            console.dir(result, { depth: 5 });
        } catch (err) {
            console.error("Failed to submit review:");
            console.error(err);
        }
    }
    await rl.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
