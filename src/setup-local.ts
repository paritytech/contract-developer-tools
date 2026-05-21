// One-shot setup for the local-chain test target.
//
// Run after `cdm deploy --bootstrap --name local --suri //Alice` (or after
// someone else has deployed contracts to your local node). It:
//   1. Queries the on-chain Contract Registry for every library's deployed
//      address.
//   2. Reads the freshly built ABIs from `target/*.release.abi.json`.
//   3. Writes a complete `contracts.<local-hash>` block into `cdm.json`.
//
// This bypasses `cdm install`, which requires a running local IPFS gateway
// to fetch on-chain metadata CIDs. Since we already have the ABIs locally
// from `cargo pvm-contract build`, IPFS isn't needed.
//
// Run: bun run setup:local

import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { CONTRACTS_REGISTRY_ABI, REGISTRY_ADDRESS, computeTargetHash } from "@dotdm/contracts";
import { readFileSync, writeFileSync } from "node:fs";

const LOCAL_WS = "ws://127.0.0.1:10020";
const LOCAL_IPFS = "http://127.0.0.1:8283/ipfs";

const LIBS: Record<string, { abiFile: string }> = {
    "@polkadot/contexts": { abiFile: "target/contexts.release.abi.json" },
    "@mock/reputation": { abiFile: "target/reputation.release.abi.json" },
    "@mock/disputes": { abiFile: "target/disputes.release.abi.json" },
    "@polkadot/profiles": { abiFile: "target/profiles.release.abi.json" },
    "@polkadot/threads": { abiFile: "target/threads.release.abi.json" },
};

const TARGET_HASH = computeTargetHash(LOCAL_WS, LOCAL_IPFS, REGISTRY_ADDRESS);
console.log(`Target hash: ${TARGET_HASH}`);

const client = createClient(getWsProvider(LOCAL_WS));
const ink = createInkSdk(client);
const registry = ink.getContract({ abi: CONTRACTS_REGISTRY_ABI } as any, REGISTRY_ADDRESS);

const aliceSs58 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
const entries: Record<string, { version: number; address: string; abi: unknown[]; metadataCid: string }> = {};

for (const [lib, info] of Object.entries(LIBS)) {
    let address: string | undefined;
    let version = 1;
    try {
        const r = await registry.query("getAddress", {
            origin: aliceSs58,
            data: { contract_name: lib },
        });
        if (r.success && r.value.response.isSome) address = r.value.response.value;
    } catch {
        // Runtime-API compat error on first call sometimes — fall through.
    }
    try {
        const v = await registry.query("getVersionCount", {
            origin: aliceSs58,
            data: { contract_name: lib },
        });
        if (v.success) version = Number(v.value.response);
    } catch {
        // Same — non-fatal.
    }
    if (!address) {
        console.warn(`  ${lib}: not in registry, skipping`);
        continue;
    }
    const abi = JSON.parse(readFileSync(info.abiFile, "utf8"));
    entries[lib] = { version, address, abi, metadataCid: "" };
    console.log(`  ${lib}  v${version}  ${address}`);
}

client.destroy();

const cdmJson = JSON.parse(readFileSync("cdm.json", "utf8"));

// Make sure the target & dependencies blocks exist and the local target is
// first (cdm install/deploy iterate Object.entries() and pick the first match
// when --name local resolves to default URL).
const localTarget = {
    "asset-hub": LOCAL_WS,
    bulletin: LOCAL_IPFS,
    registry: REGISTRY_ADDRESS,
};
cdmJson.targets = { [TARGET_HASH]: localTarget, ...cdmJson.targets };
cdmJson.dependencies = cdmJson.dependencies ?? {};
cdmJson.dependencies[TARGET_HASH] = Object.fromEntries(
    Object.keys(LIBS).map((lib) => [lib, "latest"]),
);
cdmJson.contracts = cdmJson.contracts ?? {};
cdmJson.contracts[TARGET_HASH] = entries;

writeFileSync("cdm.json", JSON.stringify(cdmJson, null, 2) + "\n");
console.log(`\nWrote cdm.json with ${Object.keys(entries).length} contracts under ${TARGET_HASH}`);
