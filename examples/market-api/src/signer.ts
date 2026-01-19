import { Keyring } from "@polkadot/api";
import { getPolkadotSigner } from "polkadot-api/signer";
import { cryptoWaitReady } from "@polkadot/util-crypto";

export type Signer = {
    address: string;
    signer: ReturnType<typeof getPolkadotSigner>;
};

await cryptoWaitReady();

export function getSigner(seed: string): Signer {
    const keyring = new Keyring({ type: "sr25519" });
    const pair = keyring.addFromUri(`//${seed}`, {}, "sr25519");
    return {
        address: pair.address,
        signer: getPolkadotSigner(
            pair.publicKey,
            "Sr25519",
            (data: Uint8Array) => pair.sign(data)
        ),
    };
}
