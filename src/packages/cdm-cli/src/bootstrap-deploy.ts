/**
 * Bootstrap deployment script.
 *
 * Deploys all contracts to a running chain:
 * 1. Maps account (required for Revive pallet)
 * 2. Deploys ContractRegistry (bootstrap - no CDM)
 * 3. Deploys remaining contracts in dependency order
 * 4. Registers each contract in the ContractRegistry
 */
import { connectWebSocket } from "./lib/connection.js";
import { ContractDeployer } from "./lib/deployer.js";
import { detectDeploymentOrder } from "./lib/detection.js";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { Binary } from "polkadot-api";
import { GAS_LIMIT, STORAGE_DEPOSIT_LIMIT, CONTRACTS_REGISTRY_CRATE } from "./constants.js";

const NODE_URL = process.argv[2] || "ws://127.0.0.1:10020";
const ROOT_DIR = resolve(import.meta.dir, "../../../..");

async function main() {
    console.log("=== CDM Bootstrap Deploy ===\n");
    console.log(`Target: ${NODE_URL}`);
    console.log(`Root: ${ROOT_DIR}\n`);

    // Connect
    console.log("Connecting...");
    const { client, api } = connectWebSocket(NODE_URL);

    // Wait for connection to be ready by fetching a runtime constant
    console.log("Waiting for chain connection...");
    const chain = await client.getChainSpecData();
    console.log(`Connected to: ${chain.name}\n`);

    const deployer = new ContractDeployer("Alice");
    deployer.setConnection(client, api);

    // Phase 0: Map account (required for Revive pallet)
    console.log("Phase 0: Mapping account...");
    try {
        await api.tx.Revive.map_account().signAndSubmit(deployer.signer);
        console.log("  Account mapped successfully\n");
    } catch (e: any) {
        console.log("  Account mapping skipped (may already be mapped)\n");
    }

    const addresses: Record<string, string> = {};

    // Phase 1: Deploy ContractRegistry (bootstrap)
    console.log("=== Phase 1: Deploy ContractRegistry (bootstrap) ===");
    const registryPvmPath = resolve(ROOT_DIR, `target/${CONTRACTS_REGISTRY_CRATE}.release.polkavm`);

    if (!existsSync(registryPvmPath)) {
        console.error(`ERROR: Contract not built: ${registryPvmPath}`);
        console.error("Run 'bash scripts/build.sh' first.");
        process.exit(1);
    }

    console.log(`Deploying ${CONTRACTS_REGISTRY_CRATE}...`);
    const registryAddr = await deployer.deploy(registryPvmPath);
    addresses["contracts"] = registryAddr;
    console.log(`  ContractRegistry deployed to: ${registryAddr}\n`);

    deployer.setRegistry(registryAddr);

    // Phase 2: Detect deployment order and deploy remaining contracts
    console.log("=== Phase 2: Deploy and register remaining contracts ===");
    const order = detectDeploymentOrder(ROOT_DIR);
    console.log(`Found ${order.crateNames.length} CDM contracts`);
    console.log(`Deployment order: ${order.crateNames.join(" -> ")}\n`);

    for (let i = 0; i < order.crateNames.length; i++) {
        const crateName = order.crateNames[i];
        const cdmPackage = order.cdmPackages[i];
        const pvmPath = resolve(ROOT_DIR, `target/${crateName}.release.polkavm`);

        if (!existsSync(pvmPath)) {
            console.error(`WARNING: Skipping ${crateName} - not built: ${pvmPath}`);
            continue;
        }

        console.log(`Deploying ${crateName}...`);
        const addr = await deployer.deploy(pvmPath);
        addresses[crateName] = addr;
        console.log(`  Deployed to: ${addr}`);

        if (cdmPackage) {
            console.log(`  Registering as ${cdmPackage}...`);
            await deployer.register(cdmPackage);
        }
        console.log();
    }

    // Save addresses
    const addrPath = resolve(ROOT_DIR, "target/.addresses.json");
    writeFileSync(addrPath, JSON.stringify(addresses, null, 2));
    console.log(`\nAddresses saved to ${addrPath}`);

    console.log("\n=== Deployment Complete ===");
    console.log("Deployed contracts:");
    for (const [name, addr] of Object.entries(addresses)) {
        console.log(`  ${name}: ${addr}`);
    }

    client.destroy();
}

main().catch((e) => {
    console.error("Deployment failed:", e);
    process.exit(1);
});
