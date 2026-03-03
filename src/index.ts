import { createCdm } from "@dotdm/cdm";
import { DEV_PHRASE } from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import { getPolkadotSigner } from "polkadot-api/signer";
import {
    entropyToMiniSecret,
    mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";

// --- Setup signer (Alice) ---
const entropy = mnemonicToEntropy(DEV_PHRASE);
const miniSecret = entropyToMiniSecret(entropy);
const derive = sr25519CreateDerive(miniSecret);
const aliceKeyPair = derive("//Alice");
const signer = getPolkadotSigner(
    aliceKeyPair.publicKey,
    "Sr25519",
    aliceKeyPair.sign,
);

// --- Create CDM instance ---
const cdm = createCdm();

// --- Get typed contract handles ---
const contexts = cdm.getContract("@polkadot/contexts");
const reputation = cdm.getContract("@polkadot/reputation");
const disputes = cdm.getContract("@polkadot/disputes");

// TODO: Add validation logic for contexts, reputation, and disputes

// --- Clean up ---
cdm.destroy();
console.log("Done!");
