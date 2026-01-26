import { PolkadotClient, TypedApi, Binary, FixedSizeBinary } from "polkadot-api";
import { AssetHub, contracts } from "@polkadot-api/descriptors";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { prepareSigner } from "./signer.js";
import { detectDeploymentOrder } from "./detection.js";
import { GAS_LIMIT, STORAGE_DEPOSIT_LIMIT } from "../constants.js";

// Helper to get typed registry contract
function getRegistryContract(client: PolkadotClient, addr: string) {
    const inkSdk = createInkSdk(client);
    return inkSdk.getContract(contracts.contractsRegistry, addr);
}

type RegistryContract = ReturnType<typeof getRegistryContract>;

export class ContractDeployer {
    public signer: ReturnType<typeof prepareSigner>;
    public api!: TypedApi<AssetHub>;
    public client!: PolkadotClient;
    public registry!: RegistryContract;
    public lastDeployedAddr: string | null = null;

    constructor(signerName: string = "Alice") {
        this.signer = prepareSigner(signerName);
    }

    /**
     * Set the API connection.
     */
    setConnection(client: PolkadotClient, api: TypedApi<AssetHub>) {
        this.client = client;
        this.api = api;
    }

    /**
     * Set the registry contract reference.
     */
    setRegistry(registryAddress: string) {
        this.registry = getRegistryContract(this.client, registryAddress);
    }

    /**
     * Register a contract in the contracts registry via ink SDK.
     */
    async register(
        cdmPackage: string,
        contractAddr?: string,
        metadataUri: string = "",
    ): Promise<void> {
        const addr = contractAddr ?? this.lastDeployedAddr;
        if (!addr) {
            throw new Error(
                "No contract address provided and no lastDeployedAddr set.",
            );
        }

        const addrBytes = Binary.fromHex(addr).asBytes();
        const address = new FixedSizeBinary(addrBytes);

        await this.registry
            .send("publish_latest", {
                data: {
                    contract_name: cdmPackage,
                    contract_address: address,
                    metadata_uri: metadataUri,
                },
                gasLimit: {
                    ref_time: GAS_LIMIT.refTime,
                    proof_size: GAS_LIMIT.proofSize,
                },
                storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
            })
            .signAndSubmit(this.signer);

        console.log(`  Registered ${cdmPackage} -> ${addr}`);
    }

    /**
     * Deploy a contract and return its address.
     * @param contractPath - Path to the .contract file
     * @returns The deployed contract's address (H160)
     */
    async deploy(contractPath: string): Promise<string> {
        const contract = JSON.parse(readFileSync(contractPath, "utf-8"));
        const code = Binary.fromHex(contract.source.contract_binary);
        const constructor = contract.spec.constructors.find(
            (c: { label: string }) => c.label === "new",
        );
        if (!constructor) {
            throw new Error(`No "new" constructor found in ${contractPath}`);
        }
        const data = Binary.fromHex(constructor.selector);

        const result = await this.api.tx.Revive.instantiate_with_code({
            value: 0n,
            weight_limit: {
                ref_time: GAS_LIMIT.refTime,
                proof_size: GAS_LIMIT.proofSize,
            },
            storage_deposit_limit: STORAGE_DEPOSIT_LIMIT,
            code,
            data,
            salt: undefined,
        }).signAndSubmit(this.signer);

        const instantiatedEvent = result.events.find(
            (e) => e.type === "Revive" && e.value.type === "Instantiated",
        );
        if (!instantiatedEvent) {
            throw new Error(
                "Contract instantiation failed - no Instantiated event",
            );
        }
        const contractAddr = (instantiatedEvent.value.value as { contract: FixedSizeBinary<20> }).contract;
        this.lastDeployedAddr = contractAddr.asHex();
        return this.lastDeployedAddr;
    }
}

/**
 * Find the path to a crate by its name.
 */
export function findCratePath(rootDir: string, crateName: string): string | null {
    const candidates = [
        `src/systems/${crateName}`,
        `src/systems/registries/${crateName}`,
        `examples/${crateName}/contract`,
    ];
    for (const candidate of candidates) {
        if (existsSync(resolve(rootDir, candidate, "Cargo.toml"))) {
            return candidate;
        }
    }
    return null;
}

/**
 * Build all contracts with the CONTRACTS_REGISTRY_ADDR environment variable set.
 */
export function buildAllContracts(rootDir: string, registryAddr: string): void {
    const order = detectDeploymentOrder(rootDir);
    console.log(
        `Building ${order.crateNames.length} contracts with CONTRACTS_REGISTRY_ADDR=${registryAddr}...`,
    );

    for (const crateName of order.crateNames) {
        const cratePath = findCratePath(rootDir, crateName);
        if (!cratePath) {
            throw new Error(`Could not find crate path for ${crateName}`);
        }
        console.log(`  Building ${crateName}...`);
        execSync(`pop build ${cratePath}`, {
            cwd: rootDir,
            stdio: "inherit",
            env: { ...process.env, CONTRACTS_REGISTRY_ADDR: registryAddr },
        });
    }
    console.log("Build complete.\n");
}

/**
 * Deploy all contracts (excluding registry) and register them.
 */
export async function deployAllContracts(
    deployer: ContractDeployer,
    rootDir: string,
): Promise<void> {
    const order = detectDeploymentOrder(rootDir);
    console.log(`Deploying ${order.crateNames.length} contracts...`);

    for (let i = 0; i < order.crateNames.length; i++) {
        const crateName = order.crateNames[i];
        const cdmPackage = order.cdmPackages[i];
        const contractPath = resolve(
            rootDir,
            `target/ink/${crateName}/${crateName}.contract`,
        );

        const addr = await deployer.deploy(contractPath);
        console.log(`  Deployed ${crateName} to: ${addr}`);

        if (cdmPackage) {
            await deployer.register(cdmPackage);
        }
    }
}
