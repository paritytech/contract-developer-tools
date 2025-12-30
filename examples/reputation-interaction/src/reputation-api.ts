import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider";
import { contracts } from "@polkadot-api/descriptors";
import { FixedSizeBinary } from "polkadot-api";
import { start } from "polkadot-api/smoldot";

import { getSigner } from "./signer";

const REPUTATION_CONTRACT_ADDR = "0x0b6670b0185b23df080b340fac8948fa2b0e7c62";
function getContract(inkSdk: ReturnType<typeof createInkSdk>) {
    return inkSdk.getContract(contracts.reputation, REPUTATION_CONTRACT_ADDR);
}

export class MarketReputationAPI {
    public signer: ReturnType<typeof getSigner>;
    public market: ReturnType<typeof getContract>;

    constructor() {
        const smoldot = start();

        this.signer = getSigner("Alice");

        // const chain = await smoldot.addChain({ chainSpec })
        const client = createClient(
            withPolkadotSdkCompat(
                getWsProvider("wss://testnet-passet-hub.polkadot.io")
            )
        );
        const inkSdk = createInkSdk(client);
        this.market = getContract(inkSdk);
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
