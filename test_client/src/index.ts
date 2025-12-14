import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { mockEntityId, randomCode } from "./util";
import { MarketReputationAPI } from "./reputation-api";

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

        // Get (or generate) entityId
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
        const id = mockEntityId(code);

        // Get rating + comment
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
