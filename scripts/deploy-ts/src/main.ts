import {
    get_api,
    getRegistryContract,
    ContractDeployer,
    build_all_contracts,
    deploy_contract_registry,
    deploy_all_contracts,
} from "./utils";
import { CONTRACTS_REGISTRY_CRATE, ROOT } from "./constants";
import { execSync } from "child_process";
import { resolve } from "path";

async function main() {
    console.log("=== Contract Deployment ===\n");

    // Phase 1: Build contracts registry first (without registry address)
    console.log("Phase 1: Building contracts registry...");
    execSync(`cargo build --release -p ${CONTRACTS_REGISTRY_CRATE}`, {
        cwd: ROOT,
        stdio: "inherit",
    });

    // Phase 2: Deploy contracts registry
    console.log("\nPhase 2: Deploying contracts registry...");
    const deployer = new ContractDeployer();

    // Connect without registry first
    const { client, api } = await get_api();
    deployer.client = client;
    deployer.api = api;

    const registryAddr = await deploy_contract_registry(deployer);
    console.log(`Registry deployed at: ${registryAddr}\n`);

    // Now set the registry on the deployer
    deployer.registry = getRegistryContract(deployer.client, registryAddr);

    // Phase 3: Build all other contracts with registry address
    console.log("Phase 3: Building contracts with registry address...");
    build_all_contracts(registryAddr);

    // Phase 4: Deploy and register all contracts
    console.log("\nPhase 4: Deploying and registering contracts...");
    await deploy_all_contracts(deployer);

    console.log("\n=== Deployment Complete ===");
    console.log(`Registry: ${registryAddr}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
