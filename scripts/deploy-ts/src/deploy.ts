import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { detectDeploymentOrder } from "./deployment-order/index.ts";
import {
    ROOT,
    NODE_URL,
    SURI,
    SKIP_REBUILD,
    CONTRACTS_REGISTRY_CRATE,
    GAS_LIMIT,
    STORAGE_DEPOSIT_LIMIT,
} from "./constants";

let api: ApiPromise;
let signer: ReturnType<Keyring["addFromUri"]>;

async function submitTx(
    tx: ReturnType<typeof api.tx.revive.mapAccount>,
    timeoutMs = 60000,
) {
    return new Promise<any[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Transaction timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        let resolved = false;
        tx.signAndSend(signer, ({ status, events, dispatchError }) => {
            console.log(`    Status: ${status.type}`);
            if (resolved) return;
            if (!status.isInBlock) return;
            resolved = true;
            clearTimeout(timeout);
            if (dispatchError) {
                let errMsg: string;
                if (dispatchError.isModule) {
                    const decoded = api.registry.findMetaError(
                        dispatchError.asModule,
                    );
                    errMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
                } else {
                    errMsg = dispatchError.toString();
                }
                reject(new Error(errMsg));
            } else {
                resolve(events);
            }
        });
    });
}

async function deploy(crateName: string): Promise<string> {
    const path = resolve(ROOT, `target/ink/${crateName}/${crateName}.contract`);
    if (!existsSync(path)) {
        throw new Error(
            `Contract not built: ${path}\nRun 'bash scripts/build.sh' first.`,
        );
    }

    const contract = JSON.parse(readFileSync(path, "utf-8"));
    const code = contract.source.contract_binary;
    const selector = contract.spec.constructors.find(
        (c: { label: string }) => c.label === "new",
    ).selector;

    const tx = api.tx.revive.instantiateWithCode(
        0,
        GAS_LIMIT,
        STORAGE_DEPOSIT_LIMIT,
        code,
        selector,
        null,
    );

    const events = await submitTx(tx);
    const instantiated = events.find(({ event }) =>
        api.events.revive.Instantiated.is(event),
    );
    return (instantiated.event.data as any).contract.toString();
}

/**
 * Call publish_latest on the contracts registry to register a contract.
 *
 * publish_latest(contract_name: String, contract_address: Address, metadata_uri: String)
 */
async function registerInRegistry(
    registryAddr: string,
    cdmPackageName: string,
    contractAddr: string,
    metadataUri: string = "",
): Promise<void> {
    // Load the contracts registry ABI to get the selector for publish_latest
    const path = resolve(
        ROOT,
        `target/ink/${CONTRACTS_REGISTRY_CRATE}/${CONTRACTS_REGISTRY_CRATE}.contract`,
    );
    const contract = JSON.parse(readFileSync(path, "utf-8"));

    const publishLatest = contract.spec.messages.find(
        (m: { label: string }) => m.label === "publish_latest",
    );
    if (!publishLatest) {
        throw new Error(
            "Could not find publish_latest in contracts registry ABI",
        );
    }

    // Encode the call data
    // The selector is 4 bytes, followed by SCALE-encoded args
    const selector = publishLatest.selector;

    // For now, we'll use a simpler approach - call via revive.call
    // The actual encoding would require proper SCALE encoding of the args
    // TODO: Use @polkadot-api/sdk-ink for proper contract calls

    console.log(`  Registering ${cdmPackageName} -> ${contractAddr}`);

    // Call the contract
    // Convert to hex string for proper handling by polkadot-api
    const callData = encodePublishLatest(
        selector,
        cdmPackageName,
        contractAddr,
        metadataUri,
    );
    const callDataHex =
        "0x" +
        Array.from(callData)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

    const tx = api.tx.revive.call(
        registryAddr, // dest
        0, // value
        GAS_LIMIT,
        STORAGE_DEPOSIT_LIMIT,
        callDataHex,
    );

    await submitTx(tx);
}

/**
 * Encode publish_latest call data.
 * Args: (contract_name: String, contract_address: Address, metadata_uri: String)
 */
function encodePublishLatest(
    selector: string,
    contractName: string,
    contractAddress: string,
    metadataUri: string,
): Uint8Array {
    // Selector (4 bytes)
    const selectorBytes = hexToBytes(selector);

    // SCALE encode String (compact length + utf8 bytes)
    const nameBytes = encodeString(contractName);
    const uriBytes = encodeString(metadataUri);

    // Address is 20 bytes (H160)
    const addrBytes = hexToBytes(contractAddress);

    // Concatenate: selector + name + address + uri
    const result = new Uint8Array(
        selectorBytes.length +
            nameBytes.length +
            addrBytes.length +
            uriBytes.length,
    );
    let offset = 0;
    result.set(selectorBytes, offset);
    offset += selectorBytes.length;
    result.set(nameBytes, offset);
    offset += nameBytes.length;
    result.set(addrBytes, offset);
    offset += addrBytes.length;
    result.set(uriBytes, offset);

    return result;
}

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
}

function encodeString(str: string): Uint8Array {
    const utf8 = new TextEncoder().encode(str);
    // Compact length encoding (for lengths < 64, it's just length * 4)
    const lenByte = utf8.length << 2;
    const result = new Uint8Array(1 + utf8.length);
    result[0] = lenByte;
    result.set(utf8, 1);
    return result;
}

function saveAddresses(addresses: Record<string, string>) {
    const path = resolve(ROOT, "target/.addresses.json");
    writeFileSync(path, JSON.stringify(addresses, null, 2));
    console.log(`Addresses saved to ${path}`);
}

/**
 * Rebuild contracts with the CONTRACTS_REGISTRY_ADDR environment variable set.
 * This allows contracts using the CDM macro to resolve the contracts registry at runtime.
 */
function rebuildContractsWithRegistryAddr(
    registryAddr: string,
    crateNames: string[],
): void {
    console.log(
        `\nRebuilding contracts with CONTRACTS_REGISTRY_ADDR=${registryAddr}...`,
    );

    // Build each contract individually with the env var set
    for (const crateName of crateNames) {
        console.log(`  Building ${crateName}...`);
        const cratePath = findCratePath(crateName);
        if (!cratePath) {
            throw new Error(`Could not find crate path for ${crateName}`);
        }

        execSync(`pop build ${cratePath}`, {
            cwd: ROOT,
            stdio: "inherit",
            env: {
                ...process.env,
                CONTRACTS_REGISTRY_ADDR: registryAddr,
            },
        });
    }

    console.log("Rebuild complete.\n");
}

/**
 * Find the path to a crate by its name.
 * Searches in src/systems/ and examples/
 */
function findCratePath(crateName: string): string | null {
    const candidates = [
        `src/systems/${crateName}`,
        `src/systems/registries/${crateName}`,
        `examples/${crateName}/contract`,
    ];

    for (const candidate of candidates) {
        const cargoPath = resolve(ROOT, candidate, "Cargo.toml");
        if (existsSync(cargoPath)) {
            return candidate;
        }
    }

    return null;
}

async function main() {
    await cryptoWaitReady();
    api = await ApiPromise.create({ provider: new WsProvider(NODE_URL) });
    signer = new Keyring({ type: "sr25519" }).addFromUri(SURI);

    // Map account (ignore if already mapped)
    try {
        await submitTx(api.tx.revive.mapAccount());
    } catch {}

    // Get deployment order (excludes contracts registry which has no CDM macro)
    console.log("Detecting deployment order...");
    const order = detectDeploymentOrder(ROOT);
    console.log(`Found ${order.crateNames.length} contracts with CDM macros`);
    console.log(`Deployment order: ${order.crateNames.join(" -> ")}\n`);

    const addresses: Record<string, string> = {};

    // Phase 1: Deploy contracts registry first (bootstrap)
    console.log(`=== Phase 1: Deploy contracts registry (bootstrap) ===`);
    console.log(`Deploying ${CONTRACTS_REGISTRY_CRATE}...`);
    const registryAddr = await deploy(CONTRACTS_REGISTRY_CRATE);
    addresses[CONTRACTS_REGISTRY_CRATE.toUpperCase()] = registryAddr;
    console.log(`  ${registryAddr}`);

    // Phase 2: Rebuild all other contracts with the registry address baked in
    if (!SKIP_REBUILD && order.crateNames.length > 0) {
        console.log(
            `\n=== Phase 2: Rebuild contracts with registry address ===`,
        );
        rebuildContractsWithRegistryAddr(registryAddr, order.crateNames);
    } else if (SKIP_REBUILD) {
        console.log(`\nSkipping rebuild (SKIP_REBUILD=true)`);
    }

    // Phase 3: Deploy remaining contracts in dependency order and register them
    if (order.crateNames.length > 0) {
        console.log(`=== Phase 3: Deploy and register contracts ===`);
    }

    for (let i = 0; i < order.crateNames.length; i++) {
        const crateName = order.crateNames[i];
        const cdmPackage = order.cdmPackages[i];

        console.log(`Deploying ${crateName}...`);
        const addr = await deploy(crateName);
        addresses[crateName.toUpperCase()] = addr;
        console.log(`  ${addr}`);

        // Register in the contracts registry
        if (cdmPackage) {
            await registerInRegistry(registryAddr, cdmPackage, addr);
        }
        console.log();
    }

    saveAddresses(addresses);
    console.log("\n=== Deployment complete! ===");
    console.log("Addresses:", addresses);

    await api.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
