/**
 * Deploy contracts to local Asset Hub using @polkadot/api
 */

import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Resolve project root
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");

const NODE_URL = process.env.NODE_URL || "ws://127.0.0.1:10020";
const SURI = process.env.SURI || "//Alice";

// Contract definitions
const CONTRACTS = {
    contexts: { crateName: "contexts" },
    contracts: { crateName: "contracts" },
    reputation: { crateName: "reputation" },
    disputes: { crateName: "disputes" },
    entity_graph: { crateName: "entity_graph" },
};

interface ContractFile {
    source: {
        hash: string;
        contract_binary: string;
    };
    spec: {
        constructors: Array<{
            label: string;
            selector: string;
        }>;
    };
}

function loadContract(crateName: string): { code: string; selector: string } {
    const contractPath = resolve(
        ROOT_DIR,
        `target/ink/${crateName}/${crateName}.contract`,
    );
    if (!existsSync(contractPath)) {
        throw new Error(`Contract not found: ${contractPath}`);
    }
    const content = readFileSync(contractPath, "utf-8");
    const contract: ContractFile = JSON.parse(content);

    const constructor = contract.spec.constructors.find(
        (c) => c.label === "new",
    );
    if (!constructor) throw new Error(`No 'new' constructor for ${crateName}`);

    return {
        code: contract.source.contract_binary,
        selector: constructor.selector,
    };
}

async function main() {
    console.log("==========================================");
    console.log("  Polkadot.js Local Deployment Script");
    console.log("==========================================");
    console.log(`Node: ${NODE_URL}`);
    console.log(`Signer: ${SURI}`);
    console.log("");

    await cryptoWaitReady();

    // Connect to node
    const provider = new WsProvider(NODE_URL);
    const api = await ApiPromise.create({ provider });

    // Setup signer
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri(SURI);

    console.log(`Deployer: ${alice.address}`);
    console.log("");

    // Step 1: Map account
    console.log("--- Mapping account ---");
    try {
        const mapTx = api.tx.revive.mapAccount();
        await new Promise<void>((resolve, reject) => {
            mapTx.signAndSend(alice, ({ status, dispatchError }) => {
                if (status.isInBlock) {
                    if (dispatchError) {
                        if (dispatchError.isModule) {
                            const decoded = api.registry.findMetaError(
                                dispatchError.asModule,
                            );
                            if (decoded.name === "AccountAlreadyMapped") {
                                console.log(
                                    "Account already mapped, continuing...",
                                );
                                resolve();
                                return;
                            }
                            reject(
                                new Error(
                                    `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`,
                                ),
                            );
                        } else {
                            reject(new Error(dispatchError.toString()));
                        }
                    } else {
                        console.log(
                            `Account mapped in block: ${status.asInBlock.toHex()}`,
                        );
                        resolve();
                    }
                }
            });
        });
    } catch (e: any) {
        console.log("Map account:", e.message);
    }
    console.log("");

    // Step 2: Deploy contracts
    const addresses: Record<string, string> = {};

    for (const [name, config] of Object.entries(CONTRACTS)) {
        console.log(`--- Deploying ${name} ---`);

        try {
            const { code, selector } = loadContract(config.crateName);
            console.log(`  Code size: ${(code.length - 2) / 2} bytes`);
            console.log(`  Constructor: ${selector}`);

            // Build constructor data (selector only, no args for these contracts)
            const data = selector;

            // Create instantiate_with_code tx
            // Params: value, gasLimit, storageDepositLimit, code, data, salt
            const tx = api.tx.revive.instantiateWithCode(
                0, // value
                { refTime: 500_000_000_000n, proofSize: 2_000_000n }, // gasLimit (Weight)
                10_000_000_000_000n, // storageDepositLimit
                code, // code (hex string)
                data, // data (constructor selector)
                null, // salt (None)
            );

            console.log("  Submitting tx...");

            const result = await new Promise<{
                blockHash: string;
                contractAddress?: string;
            }>((resolve, reject) => {
                tx.signAndSend(alice, ({ status, events, dispatchError }) => {
                    if (status.isInBlock) {
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(
                                    dispatchError.asModule,
                                );
                                reject(
                                    new Error(
                                        `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`,
                                    ),
                                );
                            } else {
                                reject(new Error(dispatchError.toString()));
                            }
                            return;
                        }

                        // Find Instantiated event
                        let contractAddress: string | undefined;
                        for (const { event } of events) {
                            if (api.events.revive.Instantiated.is(event)) {
                                // Cast to access typed event data
                                const data = event.data as unknown as { contract: { toString(): string } };
                                contractAddress = data.contract.toString();
                                break;
                            }
                        }

                        resolve({
                            blockHash: status.asInBlock.toHex(),
                            contractAddress,
                        });
                    }
                });
            });

            console.log(`  Block: ${result.blockHash}`);
            if (result.contractAddress) {
                addresses[name.toUpperCase()] = result.contractAddress;
                console.log(`  Address: ${result.contractAddress}`);
            } else {
                console.log(
                    "  WARNING: Could not find contract address in events",
                );
            }
            console.log("");
        } catch (e: any) {
            console.error(`  ERROR: ${e.message}`);
            console.log("");
        }
    }

    // Write addresses
    const addressesFile = resolve(ROOT_DIR, "target/.addresses");
    let content = "# Deployed contract addresses\n";
    content += `# Generated by deploy-pjs.ts on ${new Date().toISOString()}\n\n`;
    for (const [key, addr] of Object.entries(addresses)) {
        content += `${key}=${addr}\n`;
    }
    writeFileSync(addressesFile, content);

    console.log("==========================================");
    console.log("  Deployment complete!");
    console.log("==========================================");
    console.log("");
    console.log("Addresses:");
    for (const [key, addr] of Object.entries(addresses)) {
        console.log(`  ${key}=${addr}`);
    }
    console.log("");
    console.log(`Written to target/.addresses`);

    await api.disconnect();
}

main().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
