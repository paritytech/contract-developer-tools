import { Command } from "commander";
import { resolve } from "path";
import { execSync } from "child_process";
import { detectDeploymentOrder } from "../lib/detection.js";
import { findCratePath } from "../lib/deployer.js";

export const buildCommand = new Command("build")
    .description(
        "Build all contracts (requires CONTRACTS_REGISTRY_ADDR env var)",
    )
    .option("--contracts <names...>", "Only build specific contracts")
    .option("--root <path>", "Workspace root directory", process.cwd())
    .action(async (options) => {
        const registry = process.env.CONTRACTS_REGISTRY_ADDR;
        if (!registry) {
            console.error(
                "Error: CONTRACTS_REGISTRY_ADDR environment variable is required",
            );
            console.error("Usage: CONTRACTS_REGISTRY_ADDR=0x1234... cdm build");
            process.exit(1);
        }

        const rootDir = resolve(options.root);

        console.log("=== CDM Build ===\n");
        console.log(`Registry: ${registry}`);
        console.log(`Root: ${rootDir}\n`);

        const order = detectDeploymentOrder(rootDir);
        const contractsToBuild = options.contracts || order.crateNames;

        console.log(`Building ${contractsToBuild.length} contracts...\n`);

        for (const crateName of contractsToBuild) {
            const cratePath = findCratePath(rootDir, crateName);
            if (!cratePath) {
                console.error(
                    `Could not find crate path for ${crateName}, skipping...`,
                );
                continue;
            }

            console.log(`Building ${crateName}...`);
            execSync(`pop build ${cratePath}`, {
                cwd: rootDir,
                stdio: "inherit",
            });
        }

        console.log("\n=== Build Complete ===");
        console.log(`\nBuilt contracts:`);
        for (const crateName of contractsToBuild) {
            console.log(`  - ${crateName}`);
        }
    });
