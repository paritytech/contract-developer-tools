import { Command } from "commander";
import { resolve } from "path";
import { createConnection } from "../lib/connection.js";
import {
    ContractDeployer,
    buildAllContracts,
    deployAllContracts,
} from "../lib/deployer.js";
import { detectDeploymentOrder } from "../lib/detection.js";
import { DEFAULT_SIGNER } from "../constants.js";

export const deployCommand = new Command("deploy")
    .description("Deploy and register contracts (requires CONTRACTS_REGISTRY_ADDR env var)")
    .argument("<url>", "WebSocket URL (ws://) or chainspec path for smoldot")
    .option("-s, --signer <name>", "Signer name for dev accounts", DEFAULT_SIGNER)
    .option("--suri <uri>", "Secret URI for signing (overrides --signer)")
    .option("--skip-build", "Skip build phase (use existing artifacts)")
    .option("--dry-run", "Show deployment plan without executing")
    .option("--relay-chainspec <path>", "Path to relay chain chainspec (for smoldot with parachains)")
    .option("--root <path>", "Workspace root directory", process.cwd())
    .action(async (url: string, options) => {
        const registry = process.env.CONTRACTS_REGISTRY_ADDR;
        if (!registry) {
            console.error("Error: CONTRACTS_REGISTRY_ADDR environment variable is required");
            console.error("Usage: CONTRACTS_REGISTRY_ADDR=0x1234... cdm deploy <url>");
            process.exit(1);
        }

        const rootDir = resolve(options.root);

        console.log("=== CDM Deploy ===\n");
        console.log(`Target: ${url}`);
        console.log(`Registry: ${registry}`);
        console.log(`Root: ${rootDir}`);
        console.log(`Signer: ${options.suri || options.signer}\n`);

        // Dry run: just show what would be deployed
        if (options.dryRun) {
            console.log("=== Dry Run ===\n");

            const order = detectDeploymentOrder(rootDir);
            console.log("Contracts to deploy (in order):");
            for (let i = 0; i < order.crateNames.length; i++) {
                const pkg = order.cdmPackages[i];
                console.log(`  ${i + 1}. ${order.crateNames[i]}${pkg ? ` (${pkg})` : ""}`);
            }

            console.log("\nDependency analysis:");
            for (const contract of order.contracts) {
                if (contract.dependsOnCrates.length > 0) {
                    console.log(`  ${contract.name} depends on: ${contract.dependsOnCrates.join(", ")}`);
                }
            }

            console.log("\n(Run without --dry-run to execute deployment)");
            return;
        }

        // Phase 1: Build all contracts with registry address
        if (!options.skipBuild) {
            console.log("Phase 1: Building contracts with registry address...");
            buildAllContracts(rootDir, registry);
        }

        // Phase 2: Connect to chain
        console.log("Phase 2: Connecting to chain...");
        const signerName = options.suri?.startsWith("//")
            ? options.suri.slice(2)
            : options.signer;

        const deployer = new ContractDeployer(signerName);

        console.log(`Connecting to ${url}...`);
        const { client, api } = await createConnection(url, options.relayChainspec);
        deployer.setConnection(client, api);
        deployer.setRegistry(registry);

        // Phase 3: Deploy and register all contracts
        console.log("\nPhase 3: Deploying and registering contracts...");
        await deployAllContracts(deployer, rootDir);

        console.log("\n=== Deployment Complete ===");
        console.log(`Registry: ${registry}`);

        // List all deployed contracts
        const order = detectDeploymentOrder(rootDir);
        console.log("\nDeployed contracts:");
        for (let i = 0; i < order.crateNames.length; i++) {
            const pkg = order.cdmPackages[i];
            console.log(`  ${order.crateNames[i]}${pkg ? ` -> ${pkg}` : ""}`);
        }

        client.destroy();
    });
