import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = process.argv[2] || process.cwd();

function findCargoFiles(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    let results: string[] = [];
    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "target") {
            results = results.concat(findCargoFiles(path));
        } else if (entry.name === "Cargo.toml") {
            results.push(path);
        }
    }
    return results;
}

function isInkContract(cargoPath: string): boolean {
    const content = readFileSync(cargoPath, "utf-8");
    return content.includes("[package.metadata.ink-lang]");
}

function detectContracts(root: string): string[] {
    return findCargoFiles(root)
        .filter(isInkContract)
        .map(p => relative(root, p).replace("/Cargo.toml", ""));
}

const contracts = detectContracts(ROOT);
console.log("Detected ink! contracts:");
contracts.forEach(c => console.log(`  ${c}`));
