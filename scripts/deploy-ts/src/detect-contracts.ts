import { detectDeploymentOrder } from "./deployment-order/index.ts";

const ROOT = process.argv[2] || process.cwd();

console.log("Detecting ink! contracts with CDM annotations...\n");

const order = detectDeploymentOrder(ROOT);

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
    console.log(`  ${i + 1}. ${order.crateNames[i]}${pkg ? ` (${pkg})` : ""}`);
}
