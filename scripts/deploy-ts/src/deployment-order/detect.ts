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
 * Check if a Cargo.toml indicates a pvm contract.
 */
function isPvmContract(cargoPath: string): boolean {
    const content = readFileSync(cargoPath, "utf-8");
    return content.includes("pvm_contract");
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
 * Looks for #[pvm::contract(cdm = "...")] patterns.
 */
function findCdmPackage(libPath: string): string | null {
    if (!existsSync(libPath)) return null;

    const content = readFileSync(libPath, "utf-8");

    // Match pvm pattern: #[pvm::contract(cdm = "@polkadot/name")]
    const pvmMatch = content.match(
        /pvm::contract\s*\([^)]*cdm\s*=\s*"([^"]+)"/,
    );

    return pvmMatch ? pvmMatch[1] : null;
}

/**
 * Parse a lib.rs file to find runtime dependencies via ::reference() calls.
 * Returns crate names that are called with ::reference().
 *
 * This looks for patterns like:
 * - module::reference()
 * - parent::module::reference()
 *
 * The "contracts" module is excluded as it's the CDM bootstrap.
 */
function findDependencies(libPath: string): string[] {
    if (!existsSync(libPath)) return [];

    const content = readFileSync(libPath, "utf-8");
    const deps = new Set<string>();

    // Match both ::reference() and ::cdm_reference() patterns
    const matches = content.matchAll(/(\w+)::(?:cdm_)?reference\s*\(/g);

    for (const match of matches) {
        const moduleName = match[1];

        // Exclude the contracts registry (bootstrap) and common non-contract modules
        const excluded = ["contracts", "self", "crate", "super", "env", "pvm"];
        if (!excluded.includes(moduleName)) {
            deps.add(moduleName);
        }
    }

    return [...deps];
}

/**
 * Detect all pvm contracts in a workspace and their dependencies.
 *
 * @param rootDir - Root directory to search
 * @param options - Detection options
 * @returns Array of ContractInfo for each detected contract
 */
export function detectContracts(
    rootDir: string,
    options: DetectOptions = {},
): ContractInfo[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cargoFiles = findCargoFiles(rootDir, opts.skipDirs || []);
    const contracts: ContractInfo[] = [];

    for (const cargoPath of cargoFiles) {
        if (!isPvmContract(cargoPath)) continue;

        const cratePath = dirname(cargoPath);
        const name = getCrateName(cargoPath);

        // Find lib.rs
        const libPath = join(cratePath, "lib.rs");
        const cdmPackage = findCdmPackage(libPath);

        // Skip if cdmOnly is true and contract has no CDM annotation
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
 * Returns a map of crate name -> crate names it depends on.
 *
 * Only includes dependencies that are themselves detected contracts.
 */
export function buildDependencyGraph(
    contracts: ContractInfo[],
): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Create a set of known crate names
    const knownCrates = new Set<string>(contracts.map((c) => c.name));

    for (const contract of contracts) {
        // Filter dependencies to only include known crates
        const validDeps = contract.dependsOnCrates.filter((dep) =>
            knownCrates.has(dep),
        );
        graph.set(contract.name, validDeps);
    }

    return graph;
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
 * Create a mapping from CDM package name to crate name.
 */
export function createPackageToCrateMap(
    contracts: ContractInfo[],
): Map<string, string> {
    const map = new Map<string, string>();
    for (const contract of contracts) {
        if (contract.cdmPackage) {
            map.set(contract.cdmPackage, contract.name);
        }
    }
    return map;
}
