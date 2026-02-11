import { Command } from "commander";
import { resolve } from "path";
import {
    connectWebSocket,
    connectSmoldot,
    detectConnectionType,
} from "../lib/connection.js";
import {
    ContractDeployer,
    buildAllContracts,
    deployAllContracts,
} from "../lib/deployer.js";
import { detectDeploymentOrder } from "../lib/detection.js";
import { DEFAULT_SIGNER } from "../constants.js";

const deploy = new Command("deploy")
    .description("Deploy and register contracts (requires CONTRACTS_REGISTRY_ADDR env var)")
    .argument("<url>", "WebSocket URL (ws://) or parachain chainspec path for smoldot")
    .option("-s, --signer <name>", "Signer name for dev accounts", DEFAULT_SIGNER)
    .option("--suri <uri>", "Secret URI for signing (overrides --signer)")
    .option("--skip-build", "Skip build phase (use existing artifacts)", false)
    .option("--dry-run", "Show deployment plan without executing", false)
    .option("--relay-chainspec <path>", "Path to relay chain chainspec (required for smoldot)")
    .option("--root <path>", "Workspace root directory", process.cwd());

type DeployOptions = {
    signer: string;
    suri?: string;
    skipBuild: boolean;
    dryRun: boolean;
    relayChainspec?: string;
    root: string;
};

deploy.action(async (url: string, opts: DeployOptions) => {
    const registry = process.env.CONTRACTS_REGISTRY_ADDR;
    if (!registry) {
        console.error("Error: CONTRACTS_REGISTRY_ADDR environment variable is required");
        console.error("Usage: CONTRACTS_REGISTRY_ADDR=0x1234... cdm deploy <url>");
        process.exit(1);
    }

    const rootDir = resolve(opts.root);

    console.log("=== CDM Deploy ===\n");
    console.log(`Target: ${url}`);
    console.log(`Registry: ${registry}`);
    console.log(`Root: ${rootDir}`);
    console.log(`Signer: ${opts.suri ?? opts.signer}\n`);

    // Dry run: just show what would be deployed
    if (opts.dryRun) {
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
    if (!opts.skipBuild) {
        console.log("Phase 1: Building contracts with registry address...");
        buildAllContracts(rootDir, registry);
    }

    // Phase 2: Connect to chain
    console.log("Phase 2: Connecting to chain...");
    const signerName = opts.suri?.startsWith("//")
        ? opts.suri.slice(2)
        : opts.signer;

    const deployer = new ContractDeployer(signerName);

    console.log(`Connecting to ${url}...`);

    const connectionType = detectConnectionType(url);
    if (connectionType === "smoldot") {
        if (!opts.relayChainspec) {
            console.error("Error: --relay-chainspec is required when using smoldot");
            process.exit(1);
        }
        const { client, api } = await connectSmoldot(url, opts.relayChainspec);
        deployer.setConnection(client, api);
    } else {
        const { client, api } = connectWebSocket(url);
        deployer.setConnection(client, api);
    }

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

    deployer.client.destroy();
});

export const deployCommand = deploy;
