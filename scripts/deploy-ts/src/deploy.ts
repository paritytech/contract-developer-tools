import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const NODE_URL = process.env.NODE_URL || "ws://127.0.0.1:10020";
const SURI = process.env.SURI || "//Alice";
const CONTRACTS = ["contexts", "contracts", "reputation", "disputes", "entity_graph"];

// Generous defaults - work for most contracts, unused gas is refunded
const GAS_LIMIT = { refTime: 500_000_000_000n, proofSize: 2_000_000n };
const STORAGE_DEPOSIT_LIMIT = 10_000_000_000_000n;

let api: ApiPromise;
let signer: ReturnType<Keyring["addFromUri"]>;

async function submitTx(tx: ReturnType<typeof api.tx.revive.mapAccount>) {
    return new Promise<any[]>((resolve, reject) => {
        tx.signAndSend(signer, ({ status, events, dispatchError }) => {
            if (!status.isInBlock) return;
            if (dispatchError) {
                const err = dispatchError.isModule
                    ? api.registry.findMetaError(dispatchError.asModule)
                    : dispatchError;
                reject(new Error(String(err)));
            } else {
                resolve(events);
            }
        });
    });
}

async function deploy(crateName: string): Promise<string> {
    const path = resolve(ROOT, `target/ink/${crateName}/${crateName}.contract`);
    const contract = JSON.parse(readFileSync(path, "utf-8"));
    const code = contract.source.contract_binary;
    const selector = contract.spec.constructors.find((c: { label: string }) => c.label === "new").selector;

    const tx = api.tx.revive.instantiateWithCode(
        0, GAS_LIMIT, STORAGE_DEPOSIT_LIMIT, code, selector, null
    );

    const events = await submitTx(tx);
    const instantiated = events.find(({ event }) => api.events.revive.Instantiated.is(event));
    return (instantiated.event.data as any).contract.toString();
}

function saveAddresses(_addresses: Record<string, string>) {
    // TODO: write to target/.addresses
}

async function main() {
    await cryptoWaitReady();
    api = await ApiPromise.create({ provider: new WsProvider(NODE_URL) });
    signer = new Keyring({ type: "sr25519" }).addFromUri(SURI);

    // Map account (ignore if already mapped)
    try { await submitTx(api.tx.revive.mapAccount()); } catch {}

    const addresses: Record<string, string> = {};
    for (const name of CONTRACTS) {
        console.log(`Deploying ${name}...`);
        addresses[name.toUpperCase()] = await deploy(name);
        console.log(`  ${addresses[name.toUpperCase()]}`);
    }

    saveAddresses(addresses);
    await api.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
