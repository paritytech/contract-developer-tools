// test_client/src/index.ts

import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider";
import { contracts } from "@polkadot-api/descriptors";
//import { FixedSizeBinary } from "polkadot-api";

import { getSigner } from "./signer";

import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

const nodeAddress = "ws://localhost:9944/"
const MARKET_CONTRACT_ADDR = "0x48550a4bb374727186c55365b7c9c0a1a31bdafe";
function getContract(inkSdk: ReturnType<typeof createInkSdk>) {
    return inkSdk.getContract(contracts.mark3t_rep, MARKET_CONTRACT_ADDR);
}

function rnd(bound: number = 20): number {
    return Math.floor(Math.random() * bound) + 1;
}

class MarketReputationAPI {
    public signer: ReturnType<typeof getSigner>;
    public market: ReturnType<typeof getContract>;

    constructor() {
        this.signer = getSigner("Alice");
        const client = createClient(
            withPolkadotSdkCompat(
                getWsProvider(nodeAddress)
            )
        );
        const inkSdk = createInkSdk(client);
        this.market = inkSdk.getContract(
            contracts.mark3t_rep,
            MARKET_CONTRACT_ADDR
        );
    }

    async getAllRatings() {

        return this.market
            .query("get_all_seller_ratings", {
                origin: this.signer.address,
            
            })
            //.signAndSubmit(this.signer.signer);

    }

    async submitReview() {
        const msgName = "submit_seller_rating";

        const remarks = ["I love it", "Great!", "Crap!", "All good"];

        const data = {
            seller_rating: {
                purchase_id: BigInt(rnd()),
                timestamp: BigInt(Date.now()),
                buyer: rnd(),
                seller_id: rnd(),
                article_id: rnd(),
                seller_score: rnd(5),
                article_score: rnd(5),
                shipping_score: rnd(5),
                remark: remarks[rnd(remarks.length) - 1]
            }
        }

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
            const result = await marketRep.submitReview();

            console.log("Tx result:");
            console.dir(result, { depth: 5 });

            const allRatings = await marketRep.getAllRatings();
            console.log("returned ratings.")
            console.dir(allRatings.value, {depth: 10});
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
