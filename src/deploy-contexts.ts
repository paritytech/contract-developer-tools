// Re-deploy ONLY the `contexts` contract from this repo's source to the local
// chain, bypassing `cdm deploy` (which needs a running IPFS gateway we don't
// have). Updates cdm.json with the new address. Run after `cdm build`.
//
//   bun src/deploy-contexts.ts
//
// What it does:
//   1. Reads target/contexts.release.polkavm
//   2. Calls Revive.instantiate_with_code as Alice on ws://127.0.0.1:10020
//   3. Extracts the new contract address from the Instantiated event
//   4. Calls Revive.map_account for Alice, Bob, Charlie, Dave (idempotent)
//   5. Writes the address into cdm.json under the local target

import { createClient, Binary } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider";
import { assethub } from "@polkadot-api/descriptors";
import { seedToAccount } from "@parity/product-sdk-keys";
import { DEV_PHRASE } from "@polkadot-labs/hdkd-helpers";
import { readFileSync, writeFileSync } from "node:fs";

const LOCAL_WS = "ws://127.0.0.1:10020";
const TARGET_HASH = "20e67a0cb5547863";

const client = createClient(getWsProvider(LOCAL_WS));
const api = client.getTypedApi(assethub);

const alice = seedToAccount(DEV_PHRASE, "//Alice");
console.log(`Alice  ss58=${alice.ss58Address}  h160=${alice.h160Address}`);

// 1. Deploy contexts via instantiate_with_code
const code = Binary.fromBytes(readFileSync("target/contexts.release.polkavm"));
console.log(`Code size: ${code.asBytes().length} bytes`);

const instantiateTx = api.tx.Revive.instantiate_with_code({
    value: 0n,
    weight_limit: { ref_time: 50_000_000_000n, proof_size: 1_000_000n },
    storage_deposit_limit: 1_000_000_000_000_000n,
    code,
    data: Binary.fromBytes(new Uint8Array(0)),
    salt: undefined,
});

console.log("Submitting instantiate_with_code...");
const result = await instantiateTx.signAndSubmit(alice.signer);
console.log(`ok=${result.ok}  block=${result.block?.number}  hash=${result.txHash}`);

if (!result.ok) {
    console.error("Instantiation failed:", JSON.stringify(result.dispatchError ?? {}, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
    ));
    client.destroy();
    process.exit(1);
}

// 2. Extract the new contract address from the Instantiated event
const instantiated = result.events.find(
    (e: any) => e.type === "Revive" && e.value.type === "Instantiated",
);
if (!instantiated) {
    console.error("No Revive.Instantiated event found");
    console.error(JSON.stringify(result.events, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
    client.destroy();
    process.exit(1);
}
const newAddress = (instantiated as any).value.value.contract.asHex();
console.log(`New contexts address: ${newAddress}`);

// 3. Map accounts (idempotent — fails harmlessly if already mapped)
await Promise.all(
    (["Alice", "Bob", "Charlie", "Dave"] as const).map(async (name) => {
        const acct = seedToAccount(DEV_PHRASE, `//${name}`);
        try {
            const r = await api.tx.Revive.map_account().signAndSubmit(acct.signer);
            console.log(`map_account(${name}): ok=${r.ok}`);
        } catch (e) {
            console.log(`map_account(${name}): already mapped or error: ${(e as Error).message?.slice(0, 80) ?? e}`);
        }
    }),
);

// 4. Update cdm.json
const cdmJson = JSON.parse(readFileSync("cdm.json", "utf8"));
cdmJson.contracts ??= {};
cdmJson.contracts[TARGET_HASH] ??= {};
const existing = cdmJson.contracts[TARGET_HASH]["@polkadot/contexts"];
const abi = JSON.parse(readFileSync("target/contexts.release.abi.json", "utf8"));
cdmJson.contracts[TARGET_HASH]["@polkadot/contexts"] = {
    version: (existing?.version ?? 1) + 1,
    address: newAddress,
    abi,
    metadataCid: "",
};
writeFileSync("cdm.json", JSON.stringify(cdmJson, null, 2) + "\n");
console.log(`\nWrote new contexts (v${cdmJson.contracts[TARGET_HASH]["@polkadot/contexts"].version}) at ${newAddress} to cdm.json`);

client.destroy();
