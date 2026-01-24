import {
    detectContracts,
    buildDependencyGraph,
    createCrateToPackageMap,
    type ContractInfo,
    type DetectOptions,
} from "./detect.ts";
import { toposort } from "./toposort.ts";

export type { ContractInfo, DetectOptions } from "./detect.ts";

export interface DeploymentOrder {
    /** Crate names in deployment order */
    crateNames: string[];
    /** CDM package names in deployment order (null for contracts without CDM) */
    cdmPackages: (string | null)[];
    /** Full contract info for each contract, in deployment order */
    contracts: ContractInfo[];
}

/**
 * Detect contracts and determine deployment order based on dependencies.
 *
 * The order is determined by analyzing ::reference() calls in contract source code.
 * Contracts that are depended upon are deployed first.
 *
 * @param rootDir - Root directory of the workspace
 * @param options - Detection options
 * @returns DeploymentOrder with contracts sorted by dependency order
 */
export function detectDeploymentOrder(
    rootDir: string,
    options?: DetectOptions,
): DeploymentOrder {
    // Detect all contracts with CDM annotations
    const contracts = detectContracts(rootDir, options);

    // Build dependency graph (crate name -> crate names it depends on)
    const graph = buildDependencyGraph(contracts);

    // Topological sort by crate name
    const sortedCrates = toposort(graph);

    // Map crate names to CDM packages
    const crateToPackage = createCrateToPackageMap(contracts);
    const sortedPackages = sortedCrates.map(
        (crate) => crateToPackage.get(crate) || null,
    );

    // Sort contracts array to match deployment order
    const crateToContract = new Map(contracts.map((c) => [c.name, c]));
    const sortedContracts = sortedCrates.map(
        (crate) => crateToContract.get(crate)!,
    );

    return {
        crateNames: sortedCrates,
        cdmPackages: sortedPackages,
        contracts: sortedContracts,
    };
}

/**
 * Get just the crate names in deployment order.
 * Convenience function for simple use cases.
 */
export function getDeploymentOrder(
    rootDir: string,
    options?: DetectOptions,
): string[] {
    return detectDeploymentOrder(rootDir, options).crateNames;
}

// CLI: run directly to see deployment order
if (import.meta.main) {
    const rootDir = process.argv[2] || process.cwd();

    console.log("Detecting contracts and dependencies...\n");

    const order = detectDeploymentOrder(rootDir);

    console.log("Contracts found:");
    for (const contract of order.contracts) {
        console.log(`  ${contract.name}`);
        console.log(`    CDM Package: ${contract.cdmPackage || "(none)"}`);
        console.log(`    Path: ${contract.path}`);
        console.log(
            `    Depends on: ${contract.dependsOnCrates.length > 0 ? contract.dependsOnCrates.join(", ") : "(none)"}`,
        );
        console.log();
    }

    console.log("Deployment order:");
    for (let i = 0; i < order.crateNames.length; i++) {
        const pkg = order.cdmPackages[i];
        console.log(
            `  ${i + 1}. ${order.crateNames[i]}${pkg ? ` (${pkg})` : ""}`,
        );
    }
}
