import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname, basename } from "path";

export interface ContractInfo {
    /** Crate name (e.g., "reputation") */
    name: string;
    /** CDM package name (e.g., "@polkadot/reputation") - null if no CDM macro */
    cdmPackage: string | null;
    /** Path to contract crate directory */
    path: string;
    /** Crate names this contract depends on (runtime dependencies via reference() calls) */
    dependsOnCrates: string[];
}

export interface DetectOptions {
    /** Directories to skip (default: ["target", "node_modules"]) */
    skipDirs?: string[];
    /** Only include contracts that have CDM macro annotations (default: true) */
    cdmOnly?: boolean;
}

export interface DeploymentOrder {
    /** Crate names in deployment order */
    crateNames: string[];
    /** CDM package names in deployment order (null for contracts without CDM) */
    cdmPackages: (string | null)[];
    /** Full contract info for each contract, in deployment order */
    contracts: ContractInfo[];
}

const DEFAULT_OPTIONS: DetectOptions = {
    skipDirs: ["target", "node_modules"],
    cdmOnly: true,
};

/**
 * Find all Cargo.toml files recursively.
 */
function findCargoFiles(dir: string, skipDirs: string[]): string[] {
    if (!existsSync(dir)) return [];

    const entries = readdirSync(dir, { withFileTypes: true });
    let results: string[] = [];

    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory() && !skipDirs.includes(entry.name)) {
            results = results.concat(findCargoFiles(path, skipDirs));
        } else if (entry.name === "Cargo.toml") {
            results.push(path);
        }
    }
    return results;
}

/**
 * Check if a Cargo.toml indicates an ink! contract.
 */
function isInkContract(cargoPath: string): boolean {
    const content = readFileSync(cargoPath, "utf-8");
    return content.includes("[package.metadata.ink-lang]");
}

/**
 * Get the crate name from a Cargo.toml file.
 */
function getCrateName(cargoPath: string): string {
    const content = readFileSync(cargoPath, "utf-8");
    const match = content.match(/name\s*=\s*"([^"]+)"/);
    return match ? match[1] : basename(dirname(cargoPath));
}

/**
 * Parse a lib.rs file to find the CDM package name.
 * Looks for #[cdm_macro::cdm("...")] or #[cdm("...")] patterns.
 */
function findCdmPackage(libPath: string): string | null {
    if (!existsSync(libPath)) return null;

    const content = readFileSync(libPath, "utf-8");
    const cdmMatch = content.match(
        /#\[(?:cdm_macro::)?cdm\(\s*"([^"]+)"\s*\)\]/,
    );

    return cdmMatch ? cdmMatch[1] : null;
}

/**
 * Parse a lib.rs file to find runtime dependencies via ::reference() calls.
 */
function findDependencies(libPath: string): string[] {
    if (!existsSync(libPath)) return [];

    const content = readFileSync(libPath, "utf-8");
    const deps = new Set<string>();

    const matches = content.matchAll(/(\w+)::reference\s*\(/g);

    for (const match of matches) {
        const moduleName = match[1];
        const excluded = ["contracts", "ink", "self", "crate", "super", "env"];
        if (!excluded.includes(moduleName)) {
            deps.add(moduleName);
        }
    }

    return [...deps];
}

/**
 * Detect all ink! contracts in a workspace and their dependencies.
 */
export function detectContracts(
    rootDir: string,
    options: DetectOptions = {},
): ContractInfo[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cargoFiles = findCargoFiles(rootDir, opts.skipDirs || []);
    const contracts: ContractInfo[] = [];

    for (const cargoPath of cargoFiles) {
        if (!isInkContract(cargoPath)) continue;

        const cratePath = dirname(cargoPath);
        const name = getCrateName(cargoPath);

        const libPath = join(cratePath, "lib.rs");
        const cdmPackage = findCdmPackage(libPath);

        if (opts.cdmOnly && !cdmPackage) continue;

        const dependsOnCrates = findDependencies(libPath);

        contracts.push({
            name,
            cdmPackage,
            path: cratePath,
            dependsOnCrates,
        });
    }

    return contracts;
}

/**
 * Build a dependency graph from contract info.
 */
export function buildDependencyGraph(
    contracts: ContractInfo[],
): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    const knownCrates = new Set<string>(contracts.map((c) => c.name));

    for (const contract of contracts) {
        const validDeps = contract.dependsOnCrates.filter((dep) =>
            knownCrates.has(dep),
        );
        graph.set(contract.name, validDeps);
    }

    return graph;
}

/**
 * Topological sort using Kahn's algorithm.
 * Returns nodes in dependency order (dependencies come first).
 */
export function toposort(graph: Map<string, string[]>): string[] {
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    // Initialize all nodes
    for (const [node, deps] of graph) {
        if (!inDegree.has(node)) {
            inDegree.set(node, 0);
        }
        if (!dependents.has(node)) {
            dependents.set(node, []);
        }

        for (const dep of deps) {
            if (!inDegree.has(dep)) {
                inDegree.set(dep, 0);
            }
            if (!dependents.has(dep)) {
                dependents.set(dep, []);
            }
        }
    }

    // Count in-degrees
    for (const [node, deps] of graph) {
        inDegree.set(node, deps.length);
        for (const dep of deps) {
            dependents.get(dep)!.push(node);
        }
    }

    // Start with nodes that have no dependencies
    const queue: string[] = [];
    for (const [node, degree] of inDegree) {
        if (degree === 0) {
            queue.push(node);
        }
    }
    queue.sort();

    const result: string[] = [];

    while (queue.length > 0) {
        queue.sort();
        const node = queue.shift()!;
        result.push(node);

        for (const dependent of dependents.get(node) || []) {
            const newDegree = inDegree.get(dependent)! - 1;
            inDegree.set(dependent, newDegree);
            if (newDegree === 0) {
                queue.push(dependent);
            }
        }
    }

    // Check for cycles
    if (result.length !== inDegree.size) {
        const remaining = [...inDegree.entries()]
            .filter(([_, degree]) => degree > 0)
            .map(([node]) => node);
        throw new Error(
            `Circular dependency detected involving: ${remaining.join(", ")}`,
        );
    }

    return result;
}

/**
 * Create a mapping from crate name to CDM package name.
 */
export function createCrateToPackageMap(
    contracts: ContractInfo[],
): Map<string, string> {
    const map = new Map<string, string>();
    for (const contract of contracts) {
        if (contract.cdmPackage) {
            map.set(contract.name, contract.cdmPackage);
        }
    }
    return map;
}

/**
 * Detect contracts and determine deployment order based on dependencies.
 */
export function detectDeploymentOrder(
    rootDir: string,
    options?: DetectOptions,
): DeploymentOrder {
    const contracts = detectContracts(rootDir, options);
    const graph = buildDependencyGraph(contracts);
    const sortedCrates = toposort(graph);

    const crateToPackage = createCrateToPackageMap(contracts);
    const sortedPackages = sortedCrates.map(
        (crate) => crateToPackage.get(crate) || null,
    );

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
