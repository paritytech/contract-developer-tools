import { createAccountsProvider, metaProvider } from "@novasamatech/product-sdk";
import {
    getInjectedExtensions,
    connectInjectedExtension,
} from "polkadot-api/pjs-signer";
import type { PolkadotSigner } from "polkadot-api";
import { ss58Encode } from "@polkadot-labs/hdkd-helpers";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const REQUEST_TIMEOUT_MS = 12_000;
const EXTENSION_INJECT_DELAY_MS = 500;

const accountsProvider = createAccountsProvider();

export interface HostAccount {
    address: string;
    publicKey: Uint8Array;
    name: string | undefined;
    polkadotSigner: PolkadotSigner;
}

export function subscribeConnectionStatus(
    cb: (status: ConnectionStatus) => void,
): () => void {
    return metaProvider.subscribeConnectionStatus(cb);
}

function withTimeout<T>(fn: () => PromiseLike<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        Promise.resolve(fn()),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
        ),
    ]);
}

export async function getHostAccounts(): Promise<HostAccount[]> {
    try {
        const result = await withTimeout(
            () => accountsProvider.getNonProductAccounts(),
            REQUEST_TIMEOUT_MS,
            "getNonProductAccounts",
        );

        if (result.isOk() && result.value.length > 0) {
            const accounts = result.value;
            return accounts.map((acct) => {
                const address = ss58Encode(acct.publicKey, 42);
                const polkadotSigner = accountsProvider.getNonProductAccountSigner({
                    dotNsIdentifier: "",
                    derivationIndex: 0,
                    publicKey: acct.publicKey,
                });
                return { address, publicKey: acct.publicKey, name: acct.name, polkadotSigner };
            });
        }
    } catch (err) {
        console.warn("[host] Non-product accounts failed:", err);
    }

    try {
        await new Promise((r) => setTimeout(r, EXTENSION_INJECT_DELAY_MS));
        const extensions = getInjectedExtensions();
        for (const name of extensions) {
            try {
                const ext = await withTimeout(
                    () => connectInjectedExtension(name),
                    5_000,
                    `connectInjectedExtension(${name})`,
                );
                const accounts = ext.getAccounts();
                if (accounts.length > 0) {
                    return accounts.map((acct) => ({
                        address: acct.address,
                        publicKey: new Uint8Array(0),
                        name: acct.name,
                        polkadotSigner: acct.polkadotSigner,
                    }));
                }
            } catch (err) {
                console.warn(`[host] Extension ${name} failed:`, err);
            }
        }
    } catch (err) {
        console.warn("[host] Extension check failed:", err);
    }

    return [];
}
