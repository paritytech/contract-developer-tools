import { PolkadotClient, TypedApi, Binary, FixedSizeBinary } from "polkadot-api";
import { AssetHub } from "@polkadot-api/descriptors";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { prepareSigner } from "./signer.js";
import { detectDeploymentOrder } from "./detection.js";
import { GAS_LIMIT, STORAGE_DEPOSIT_LIMIT } from "../constants.js";

/**
 * ABI-encode a call to publishLatest(string,address,string).
 *
 * Solidity ABI encoding for dynamic types:
 *   selector (4 bytes)
 *   offset to contract_name (32 bytes) -> points to dynamic data
 *   address (32 bytes, left-padded)
 *   offset to metadata_uri (32 bytes) -> points to dynamic data
 *   contract_name length (32 bytes)
 *   contract_name data (padded to 32 bytes)
 *   metadata_uri length (32 bytes)
 *   metadata_uri data (padded to 32 bytes)
 */
function encodePublishLatest(
    contractName: string,
    contractAddress: Uint8Array,
    metadataUri: string,
): Uint8Array {
    // Selector for publishLatest(string,address,string)
    // keccak256("publishLatest(string,address,string)") first 4 bytes
    const selector = computeSelector("publishLatest(string,address,string)");

    const nameBytes = new TextEncoder().encode(contractName);
    const uriBytes = new TextEncoder().encode(metadataUri);

    const namePadded = Math.ceil(nameBytes.length / 32) * 32;
    const uriPadded = Math.ceil(uriBytes.length / 32) * 32;

    // Head: selector(4) + 3 params * 32 bytes each = 4 + 96
    // Tail: name(32 + namePadded) + uri(32 + uriPadded)
    const headSize = 4 + 96;
    const nameOffset = 96; // offset from start of params to first dynamic data
    const nameSection = 32 + namePadded; // length word + padded data
    const uriOffset = nameOffset + nameSection;

    const totalSize = headSize + nameSection + 32 + uriPadded;
    const calldata = new Uint8Array(totalSize);

    // Write selector
    calldata.set(selector, 0);

    // Param 0: offset to contract_name
    writeUint256(calldata, 4, BigInt(nameOffset));

    // Param 1: address (20 bytes, left-padded to 32)
    calldata.set(contractAddress, 4 + 32 + 12); // 12 bytes padding

    // Param 2: offset to metadata_uri
    writeUint256(calldata, 4 + 64, BigInt(uriOffset));

    // Dynamic data: contract_name
    let pos = headSize;
    writeUint256(calldata, pos, BigInt(nameBytes.length));
    pos += 32;
    calldata.set(nameBytes, pos);
    pos += namePadded;

    // Dynamic data: metadata_uri
    writeUint256(calldata, pos, BigInt(uriBytes.length));
    pos += 32;
    calldata.set(uriBytes, pos);

    return calldata;
}

/**
 * Write a uint256 value at the given offset in a Uint8Array (big-endian).
 */
function writeUint256(buf: Uint8Array, offset: number, value: bigint): void {
    for (let i = 31; i >= 0; i--) {
        buf[offset + i] = Number(value & 0xffn);
        value >>= 8n;
    }
}

/**
 * Compute the 4-byte Solidity function selector from a signature string.
 * Uses keccak256 hash.
 */
function computeSelector(signature: string): Uint8Array {
    // Simple keccak256 implementation for function selectors
    const hash = keccak256(new TextEncoder().encode(signature));
    return hash.slice(0, 4);
}

/**
 * Minimal keccak256 for computing Solidity function selectors.
 */
function keccak256(input: Uint8Array): Uint8Array {
    // Keccak-256 constants
    const RC = [
        0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
        0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
        0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
        0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
        0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
        0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
        0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
        0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
    ];
    const ROTC = [
        1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25,
        43, 62, 18, 39, 61, 20, 44,
    ];
    const PI = [
        10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12,
        2, 20, 14, 22, 9, 6, 1,
    ];

    const rate = 136; // (1600 - 256*2) / 8
    const capacity = 32;

    // Pad input (keccak padding: 0x01 ... 0x80)
    const padLen = rate - (input.length % rate);
    const padded = new Uint8Array(input.length + padLen);
    padded.set(input);
    padded[input.length] = 0x01;
    padded[padded.length - 1] |= 0x80;

    // State: 5x5 matrix of 64-bit words
    const state = new BigUint64Array(25);

    // Absorb
    for (let offset = 0; offset < padded.length; offset += rate) {
        for (let i = 0; i < rate / 8; i++) {
            let word = 0n;
            for (let b = 0; b < 8; b++) {
                word |= BigInt(padded[offset + i * 8 + b]) << BigInt(b * 8);
            }
            state[i] ^= word;
        }
        keccakF(state, RC, ROTC, PI);
    }

    // Squeeze
    const output = new Uint8Array(capacity);
    for (let i = 0; i < capacity / 8; i++) {
        let word = state[i];
        for (let b = 0; b < 8; b++) {
            output[i * 8 + b] = Number(word & 0xffn);
            word >>= 8n;
        }
    }
    return output;
}

function keccakF(
    state: BigUint64Array,
    RC: bigint[],
    ROTC: number[],
    PI: number[],
): void {
    const mask = 0xffffffffffffffffn;
    for (let round = 0; round < 24; round++) {
        // Theta
        const C = new BigUint64Array(5);
        for (let x = 0; x < 5; x++) {
            C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
        }
        const D = new BigUint64Array(5);
        for (let x = 0; x < 5; x++) {
            D[x] = C[(x + 4) % 5] ^ (((C[(x + 1) % 5] << 1n) | (C[(x + 1) % 5] >> 63n)) & mask);
        }
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                state[x + y * 5] = (state[x + y * 5] ^ D[x]) & mask;
            }
        }

        // Rho and Pi
        let current = state[1];
        for (let i = 0; i < 24; i++) {
            const j = PI[i];
            const temp = state[j];
            const r = BigInt(ROTC[i]);
            state[j] = (((current << r) | (current >> (64n - r))) & mask);
            current = temp;
        }

        // Chi
        for (let y = 0; y < 5; y++) {
            const T = new BigUint64Array(5);
            for (let x = 0; x < 5; x++) {
                T[x] = state[x + y * 5];
            }
            for (let x = 0; x < 5; x++) {
                state[x + y * 5] = (T[x] ^ ((~T[(x + 1) % 5] & mask) & T[(x + 2) % 5])) & mask;
            }
        }

        // Iota
        state[0] = (state[0] ^ RC[round]) & mask;
    }
}

export class ContractDeployer {
    public signer: ReturnType<typeof prepareSigner>;
    public api!: TypedApi<AssetHub>;
    public client!: PolkadotClient;
    public registryAddress!: string;
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
     * Set the registry address.
     */
    setRegistry(registryAddress: string) {
        this.registryAddress = registryAddress;
    }

    /**
     * Register a contract in the contracts registry by calling
     * publishLatest(string,address,string) via Revive.call.
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

        // Parse the contract address (H160) into bytes
        const addrHex = addr.startsWith("0x") ? addr.slice(2) : addr;
        const addrBytes = new Uint8Array(20);
        for (let i = 0; i < 20; i++) {
            addrBytes[i] = parseInt(addrHex.slice(i * 2, i * 2 + 2), 16);
        }

        // ABI-encode the publishLatest call
        const calldata = encodePublishLatest(cdmPackage, addrBytes, metadataUri);

        // Parse registry address
        const registryHex = this.registryAddress.startsWith("0x")
            ? this.registryAddress.slice(2)
            : this.registryAddress;
        const registryBytes = new Uint8Array(20);
        for (let i = 0; i < 20; i++) {
            registryBytes[i] = parseInt(registryHex.slice(i * 2, i * 2 + 2), 16);
        }

        await this.api.tx.Revive.call({
            dest: new FixedSizeBinary(registryBytes),
            value: 0n,
            weight_limit: {
                ref_time: GAS_LIMIT.refTime,
                proof_size: GAS_LIMIT.proofSize,
            },
            storage_deposit_limit: STORAGE_DEPOSIT_LIMIT,
            data: Binary.fromBytes(calldata),
        }).signAndSubmit(this.signer);

        console.log(`  Registered ${cdmPackage} -> ${addr}`);
    }

    /**
     * Deploy a pvm contract and return its address.
     * @param pvmPath - Path to the .polkavm bytecode file
     * @returns The deployed contract's address (H160)
     */
    async deploy(pvmPath: string): Promise<string> {
        const bytecode = readFileSync(pvmPath);
        const code = Binary.fromBytes(bytecode);
        const data = Binary.fromBytes(new Uint8Array(0));

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

        // Check for failure
        const failEvent = result.events.find(
            (e) => e.type === "System" && e.value.type === "ExtrinsicFailed",
        );
        if (failEvent) {
            const stringify = (obj: unknown) =>
                JSON.stringify(obj, (_, v) => typeof v === "bigint" ? v.toString() : v, 2);
            console.error("Transaction failed:", stringify(failEvent.value.value));
            throw new Error("Deployment transaction failed");
        }

        const instantiatedEvent = result.events.find(
            (e) => e.type === "Revive" && e.value.type === "Instantiated",
        );
        if (!instantiatedEvent) {
            console.error(
                "Events received:",
                JSON.stringify(
                    result.events.map((e) => ({ type: e.type, value: e.value.type })),
                    null,
                    2,
                ),
            );
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
 * Build a single contract using `cargo pvm-contract build`.
 * Optionally sets CONTRACTS_REGISTRY_ADDR for CDM-enabled contracts.
 */
export function pvmContractBuild(
    rootDir: string,
    crateName: string,
    registryAddr?: string,
): void {
    const manifestPath = resolve(rootDir, "Cargo.toml");
    const cmd = `cargo pvm-contract build --manifest-path ${manifestPath} -p ${crateName}`;
    const env: Record<string, string> = { ...process.env as Record<string, string> };
    if (registryAddr) {
        env.CONTRACTS_REGISTRY_ADDR = registryAddr;
    }
    execSync(cmd, { cwd: rootDir, stdio: "inherit", env });
}

/**
 * Build all CDM contracts with the CONTRACTS_REGISTRY_ADDR set.
 */
export function buildAllContracts(rootDir: string, registryAddr: string): void {
    const order = detectDeploymentOrder(rootDir);
    console.log(
        `Building ${order.crateNames.length} contracts with CONTRACTS_REGISTRY_ADDR=${registryAddr}...`,
    );

    for (const crateName of order.crateNames) {
        console.log(`  Building ${crateName}...`);
        pvmContractBuild(rootDir, crateName, registryAddr);
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
        const pvmPath = resolve(
            rootDir,
            `target/${crateName}.release.polkavm`,
        );

        const addr = await deployer.deploy(pvmPath);
        console.log(`  Deployed ${crateName} to: ${addr}`);

        if (cdmPackage) {
            await deployer.register(cdmPackage);
        }
    }
}
