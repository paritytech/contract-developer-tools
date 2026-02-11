import { createClient, PolkadotClient, TypedApi } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getPolkadotSigner } from "polkadot-api/signer";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import {
    DEV_PHRASE,
    entropyToMiniSecret,
    mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { AssetHub, assetHub, contracts } from "@polkadot-api/descriptors";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { detectDeploymentOrder } from "../deployment-order";
import { ROOT, NODE_URL, GAS_LIMIT, STORAGE_DEPOSIT_LIMIT, CONTRACTS_REGISTRY_CRATE } from "../constants";
import { Binary, FixedSizeBinary } from "polkadot-api";

// Chainspec paths from bin/
const RELAY_CHAINSPEC = resolve(ROOT, "bin/westend-local.json");
const ASSETHUB_CHAINSPEC = resolve(ROOT, "bin/asset_hub.json");

/**
 * Connects to Asset Hub via WebSocket (for local development).
 */
function get_api_ws() {
    const client = createClient(withPolkadotSdkCompat(getWsProvider(NODE_URL)));
    return { client, api: client.getTypedApi(assetHub) };
}

/**
 * Connects to Asset Hub via smoldot light client (for production).
 */
async function get_api_smoldot() {
    const smoldot = start();

    const relayChainSpec = readFileSync(RELAY_CHAINSPEC, "utf-8");
    const assetHubChainSpec = readFileSync(ASSETHUB_CHAINSPEC, "utf-8");

    const relayChain = await smoldot.addChain({ chainSpec: relayChainSpec });
    const assetHubChain = await smoldot.addChain({
        chainSpec: assetHubChainSpec,
        potentialRelayChains: [relayChain],
    });

    const client = createClient(getSmProvider(assetHubChain));
    return { client, api: client.getTypedApi(assetHub) };
}

/**
 * Default: use WebSocket for local dev.
 */
function get_api() {
    return get_api_ws();
}

/**
 * Prepares a signer from a dev account name (e.g., "Alice", "Bob").
 * Uses sr25519 key derivation compatible with Substrate dev accounts.
 */
function prepare_signer(name: string) {
    const entropy = mnemonicToEntropy(DEV_PHRASE);
    const miniSecret = entropyToMiniSecret(entropy);
    const derive = sr25519CreateDerive(miniSecret);
    const hdkdKeyPair = derive(`//${name}`);

    return getPolkadotSigner(
        hdkdKeyPair.publicKey,
        "Sr25519",
        hdkdKeyPair.sign,
    );
}

// Helper to get typed registry contract
function getRegistryContract(client: PolkadotClient, addr: string) {
    const inkSdk = createInkSdk(client);
    return inkSdk.getContract(contracts.contractsRegistry, addr);
}
type RegistryContract = ReturnType<typeof getRegistryContract>;

class ContractDeployer {
    public signer = prepare_signer("Alice");
    public api: TypedApi<AssetHub>;
    public client: PolkadotClient;
    public registry: RegistryContract;
    public lastDeployedAddr: string | null = null;

    constructor() {}

    async connect(registryAddress: string) {
        const { client, api } = await get_api();
        this.client = client;
        this.api = api;
        this.registry = getRegistryContract(this.client, registryAddress);
    }

    /**
     * Register a contract in the contracts registry via papi SDK.
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

        // Convert hex address to FixedSizeBinary<20>
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

        // Submit the instantiate transaction
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

        // Find the Instantiated event to get the contract address
        const instantiatedEvent = result.events.find(
            (e) => e.type === "Revive" && e.value.type === "Instantiated",
        );
        if (!instantiatedEvent) {
            throw new Error(
                "Contract instantiation failed - no Instantiated event",
            );
        }
        const contractAddr = (instantiatedEvent.value.value as { contract: FixedSizeBinary<20> }).contract;
        return contractAddr.asHex();
    }
}

/**
 * Find the path to a crate by its name.
 */
function findCratePath(crateName: string): string | null {
    const candidates = [
        `src/systems/${crateName}`,
        `src/systems/registries/${crateName}`,
        `examples/${crateName}/contract`,
    ];
    for (const candidate of candidates) {
        if (existsSync(resolve(ROOT, candidate, "Cargo.toml"))) {
            return candidate;
        }
    }
    return null;
}

/**
 * Build all contracts with the CONTRACTS_REGISTRY_ADDR environment variable set.
 */
function build_all_contracts(registryAddr: string): void {
    const order = detectDeploymentOrder(ROOT);
    console.log(`Building ${order.crateNames.length} contracts with CONTRACTS_REGISTRY_ADDR=${registryAddr}...`);

    for (const crateName of order.crateNames) {
        const cratePath = findCratePath(crateName);
        if (!cratePath) {
            throw new Error(`Could not find crate path for ${crateName}`);
        }
        console.log(`  Building ${crateName}...`);
        execSync(`cargo build --release -p ${crateName}`, {
            cwd: ROOT,
            stdio: "inherit",
            env: { ...process.env, CONTRACTS_REGISTRY_ADDR: registryAddr },
        });
    }
    console.log("Build complete.\n");
}

/**
 * Deploy the contracts registry and return its address.
 */
async function deploy_contract_registry(deployer: ContractDeployer): Promise<string> {
    const contractPath = resolve(ROOT, `target/pvm/${CONTRACTS_REGISTRY_CRATE}/${CONTRACTS_REGISTRY_CRATE}.contract`);
    if (!existsSync(contractPath)) {
        throw new Error(`Contracts registry not built: ${contractPath}`);
    }
    console.log("Deploying contracts registry...");
    const addr = await deployer.deploy(contractPath);
    console.log(`  Deployed to: ${addr}`);
    return addr;
}

/**
 * Deploy all contracts (excluding registry) and register them.
 */
async function deploy_all_contracts(deployer: ContractDeployer): Promise<void> {
    const order = detectDeploymentOrder(ROOT);
    console.log(`Deploying ${order.crateNames.length} contracts...`);

    for (let i = 0; i < order.crateNames.length; i++) {
        const crateName = order.crateNames[i];
        const cdmPackage = order.cdmPackages[i];
        const contractPath = resolve(ROOT, `target/pvm/${crateName}/${crateName}.contract`);

        const addr = await deployer.deploy(contractPath);
        deployer.lastDeployedAddr = addr;
        console.log(`  Deployed ${crateName} to: ${addr}`);

        if (cdmPackage) {
            await deployer.register(cdmPackage);
        }
    }
}

export {
    get_api,
    get_api_ws,
    get_api_smoldot,
    prepare_signer,
    getRegistryContract,
    ContractDeployer,
    build_all_contracts,
    deploy_contract_registry,
    deploy_all_contracts,
};
