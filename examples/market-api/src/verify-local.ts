/**
 * Verify local deployment by interacting with deployed contracts
 *
 * Run: bun src/verify-local.ts
 */

import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient, FixedSizeBinary } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { contracts } from "@polkadot-api/descriptors";
import { readFileSync } from "fs";
import { join } from "path";
import { decodeAddress } from "@polkadot/util-crypto";

import { getSigner } from "./signer";
import { mockEntityId } from "./util";

const LOCAL_NODE = "ws://127.0.0.1:9944";

// Read addresses from target/.addresses
function loadAddresses(): Record<string, string> {
    const addressFile = join(__dirname, "../../../target/.addresses");
    const content = readFileSync(addressFile, "utf-8");
    const addresses: Record<string, string> = {};

    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const [key, value] = trimmed.split("=");
        if (key && value) {
            addresses[key.trim()] = value.trim();
        }
    }

    return addresses;
}

// Convert SS58 address to 20-byte FixedSizeBinary for pvm contracts
function ss58ToAddress20(ss58: string): FixedSizeBinary<20> {
    const decoded = decodeAddress(ss58);
    // Take the first 20 bytes for EVM-compatible address
    const bytes20 = decoded.slice(0, 20);
    return new FixedSizeBinary(new Uint8Array(bytes20));
}

async function main() {
    console.log("🔗 Connecting to local node at", LOCAL_NODE);

    // Load deployed addresses
    const addresses = loadAddresses();
    console.log("\n📋 Deployed addresses:");
    for (const [key, value] of Object.entries(addresses)) {
        console.log(`   ${key}: ${value}`);
    }

    if (!addresses.CONTEXT_REGISTRY || !addresses.REPUTATION) {
        console.error(
            "\n❌ Missing required addresses. Run deploy-local.sh first."
        );
        process.exit(1);
    }

    // Connect to local node
    const client = createClient(
        withPolkadotSdkCompat(getWsProvider(LOCAL_NODE))
    );
    const inkSdk = createInkSdk(client);
    const signer = getSigner("Alice");
    const signerAddress20 = ss58ToAddress20(signer.address);

    console.log("\n👤 Using signer:", signer.address);

    // Get contract instances
    const contextRegistry = inkSdk.getContract(
        contracts.contexts,
        addresses.CONTEXT_REGISTRY
    );

    const reputation = inkSdk.getContract(
        contracts.reputation,
        addresses.REPUTATION
    );

    // Test 1: Check context registry - query for a non-existent context
    console.log("\n--- Test 1: Context Registry Query ---");
    const testContextId = mockEntityId("TEST");

    try {
        const ownerResult = await contextRegistry.query("get_owner", {
            origin: signer.address,
            data: { context_id: testContextId },
        });
        console.log("✓ Context registry query succeeded");
        console.log(
            "  get_owner(TEST) =",
            ownerResult.value?.success ? ownerResult.value.value : "None"
        );
    } catch (err) {
        console.log("✗ Context registry query failed:", err);
    }

    // Test 2: Register a context
    console.log("\n--- Test 2: Register Context ---");
    const myContextId = mockEntityId("CTX2");

    try {
        console.log("  Registering context CTX2...");
        const registerResult = await contextRegistry
            .send("register_context", {
                origin: signer.address,
                data: { context_id: myContextId },
            })
            .signAndSubmit(signer.signer);
        console.log("✓ Context registered, tx:", registerResult.txHash);
    } catch (err: any) {
        if (err.message?.includes("already registered")) {
            console.log("  (Context already registered, that's OK)");
        } else {
            console.log("✗ Register context failed:", err.message || err);
        }
    }

    // Test 3: Check is_owner with proper address encoding
    console.log("\n--- Test 3: Check Context Ownership ---");
    try {
        const ownerCheck = await contextRegistry.query("is_owner", {
            origin: signer.address,
            data: {
                context_id: myContextId,
                address: signerAddress20,
            },
        });
        console.log(
            "✓ is_owner(CTX2, Alice) =",
            ownerCheck.value?.success ? ownerCheck.value.value : "error"
        );
    } catch (err: any) {
        console.log("✗ is_owner query failed:", err.message || err);
    }

    // Test 4: Submit a review (this requires being the context owner)
    console.log("\n--- Test 4: Submit Review ---");
    const entityId = mockEntityId("ENT1");

    try {
        console.log("  Submitting review for entity ENT1...");
        const reviewResult = await reputation
            .send("submit_review", {
                origin: signer.address,
                data: {
                    context_id: myContextId,
                    reviewer: signerAddress20,
                    review: {
                        rating: 5,
                        comment_uri: "ipfs://QmTest123",
                    },
                    entity: entityId,
                },
            })
            .signAndSubmit(signer.signer);
        console.log("✓ Review submitted, tx:", reviewResult.txHash);
    } catch (err: any) {
        console.log("✗ Submit review failed:", err.message || err);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Verification complete!");
    console.log("=".repeat(50));
    console.log("\n📊 View contracts in Polkadot.js Apps:");
    console.log(
        "   https://polkadot.js.org/apps/?rpc=ws://localhost:9944/#/explorer"
    );

    // Clean up
    client.destroy();
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
