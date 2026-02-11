/**
 * Integration test to verify cross-contract communication.
 *
 * This test:
 * 1. Queries the contracts registry to verify all contracts are registered
 * 2. Registers a context in the contexts contract
 * 3. Submits a review via reputation (which calls contexts.is_owner() internally)
 *
 * Usage: CONTRACTS_REGISTRY_ADDR=0x... bun src/integration-test.ts
 */
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { contracts } from "@polkadot-api/descriptors";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { prepare_signer } from "./utils";
import { NODE_URL, GAS_LIMIT, STORAGE_DEPOSIT_LIMIT } from "./constants";
import { Binary, FixedSizeBinary } from "polkadot-api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { exit } from "process";

const REGISTRY_ADDR = process.env.CONTRACTS_REGISTRY_ADDR;
if (!REGISTRY_ADDR) {
    console.error(
        "Error: CONTRACTS_REGISTRY_ADDR environment variable is required",
    );
    process.exit(1);
}

// Generate a random context ID (32 bytes)
function randomContextId(): FixedSizeBinary<32> {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return new FixedSizeBinary(bytes);
}

// Generate a random entity ID (32 bytes)
function randomEntityId(): FixedSizeBinary<32> {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return new FixedSizeBinary(bytes);
}

async function main() {
    console.log("=== Integration Test: Cross-Contract Communication ===\n");
    console.log(`Registry: ${REGISTRY_ADDR}`);
    console.log(`Node: ${NODE_URL}\n`);

    // Wait for crypto to be ready
    await cryptoWaitReady();

    const client = createClient(withPolkadotSdkCompat(getWsProvider(NODE_URL)));
    const inkSdk = createInkSdk(client);
    const signer = prepare_signer("Alice");

    // Get Alice's SS58 address for queries (papi SDK requires SS58 for origin)
    const keyring = new Keyring({ type: "sr25519" });
    const aliceKeyring = keyring.addFromUri("//Alice");
    const aliceSS58 = aliceKeyring.address;

    // Get Alice's H160 address for contract parameters
    const alicePubkey = (signer as any).publicKey as Uint8Array;
    const aliceH160 = new FixedSizeBinary(alicePubkey.slice(0, 20));

    const registry = inkSdk.getContract(
        contracts.contractsRegistry,
        REGISTRY_ADDR,
    );

    // Phase 1: Query registry for all contract addresses
    console.log("Phase 1: Querying contracts registry...");
    const contractNames = [
        "@polkadot/contexts",
        "@polkadot/disputes",
        "@polkadot/entity_graph",
        "@polkadot/reputation",
    ];

    const addresses: Record<string, string> = {};

    for (const name of contractNames) {
        const result = await registry.query("get_address", {
            origin: aliceSS58,
            data: { contract_name: name },
        });
        if (result.success) {
            const response = (result as any).value?.response;
            const rawHex = response?.asHex?.() || "";
            // Parse H160 response (either Option-wrapped or direct)
            if (rawHex.startsWith("0x01") && rawHex.length >= 42) {
                addresses[name] = "0x" + rawHex.slice(4, 44);
            } else if (rawHex.length === 42) {
                addresses[name] = rawHex;
            }
            if (addresses[name]) {
                console.log(`  ${name}: ${addresses[name]}`);
            } else {
                console.log(`  ${name}: NOT REGISTERED`);
            }
        } else {
            console.log(`  ${name}: QUERY FAILED`);
        }
    }

    const contextsAddr = addresses["@polkadot/contexts"];
    const reputationAddr = addresses["@polkadot/reputation"];

    if (!contextsAddr || !reputationAddr) {
        console.error("\nError: Required contracts not registered");
        client.destroy();
        process.exit(1);
    }

    // Phase 2: Register a context
    console.log("\nPhase 2: Registering a new context...");
    const contexts = inkSdk.getContract(contracts.contexts, contextsAddr);
    const contextId = randomContextId();
    console.log(`  Context ID: ${contextId.asHex()}`);

    try {
        await contexts
            .send("register_context", {
                data: { context_id: contextId },
                gasLimit: {
                    ref_time: GAS_LIMIT.refTime,
                    proof_size: GAS_LIMIT.proofSize,
                },
                storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
            })
            .signAndSubmit(signer);
        console.log("  Context registered successfully!");
    } catch (e: any) {
        console.error(`  Failed to register context: ${e.message}`);
        client.destroy();
        process.exit(1);
    }

    // Phase 3: Verify context ownership
    console.log("\nPhase 3: Verifying context ownership...");
    const ownerResult = await contexts.query("get_owner", {
        origin: aliceSS58,
        data: { context_id: contextId },
    });
    if (ownerResult.success) {
        const response = (ownerResult as any).value?.response;
        const rawHex = response?.asHex?.() || "";
        if (rawHex.startsWith("0x01")) {
            const owner = "0x" + rawHex.slice(4, 44);
            console.log(`  Owner: ${owner}`);
        } else {
            console.log("  Owner: None (unexpected)");
        }
    }

    // Phase 4: Submit a review via reputation contract
    console.log(
        "\nPhase 4: Testing cross-contract call (reputation -> contexts)...",
    );
    const reputation = inkSdk.getContract(contracts.reputation, reputationAddr);
    const entityId = randomEntityId();
    const review = {
        rating: 5,
        comment_uri: "ipfs://test-review",
    };

    console.log(
        `  Submitting review for entity: ${entityId.asHex().slice(0, 18)}...`,
    );
    console.log(
        `  This calls reputation.submit_review() which internally calls contexts.is_owner()`,
    );

    try {
        await reputation
            .send("submit_review", {
                data: {
                    context_id: contextId,
                    reviewer: aliceH160,
                    review,
                    entity: entityId,
                },
                gasLimit: {
                    ref_time: GAS_LIMIT.refTime,
                    proof_size: GAS_LIMIT.proofSize,
                },
                storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
            })
            .signAndSubmit(signer);
        console.log("  Review submitted successfully!");
        console.log(
            "\n=== SUCCESS: Cross-contract communication verified! ===",
        );
        console.log(
            "The reputation contract successfully called the contexts contract",
        );
        console.log("to verify ownership before accepting the review.\n");
    } catch (e: any) {
        console.error(`  Failed: ${e.message}`);
        console.log("\n=== FAILED: Cross-contract communication issue ===\n");
        client.destroy();
        process.exit(1);
    }

    client.destroy();
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
