import { getPolkadotSigner } from "polkadot-api/signer";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import {
    DEV_PHRASE,
    entropyToMiniSecret,
    mnemonicToEntropy,
    ss58Encode,
} from "@polkadot-labs/hdkd-helpers";

const STORAGE_KEY = "disputes-wallet";

export type Signer = ReturnType<typeof getPolkadotSigner>;

export interface WalletInfo {
    signer: Signer;
    publicKey: Uint8Array;
    address: string;
}

export function deriveWallet(mnemonic: string): WalletInfo {
    const entropy = mnemonicToEntropy(mnemonic);
    const miniSecret = entropyToMiniSecret(entropy);
    const derive = sr25519CreateDerive(miniSecret);
    const keyPair = derive("//0");

    const signer = getPolkadotSigner(keyPair.publicKey, "Sr25519", keyPair.sign);
    const address = ss58Encode(keyPair.publicKey, 42);

    return { signer, publicKey: keyPair.publicKey, address };
}

export function getAliceSigner(): Signer {
    const entropy = mnemonicToEntropy(DEV_PHRASE);
    const miniSecret = entropyToMiniSecret(entropy);
    const derive = sr25519CreateDerive(miniSecret);
    const keyPair = derive("//Alice");

    return getPolkadotSigner(keyPair.publicKey, "Sr25519", keyPair.sign);
}

export function getAliceAddress(): string {
    const entropy = mnemonicToEntropy(DEV_PHRASE);
    const miniSecret = entropyToMiniSecret(entropy);
    const derive = sr25519CreateDerive(miniSecret);
    const keyPair = derive("//Alice");
    return ss58Encode(keyPair.publicKey, 42);
}

export function persistWallet(mnemonic: string): void {
    localStorage.setItem(STORAGE_KEY, mnemonic);
}

export function loadPersistedWallet(): WalletInfo | null {
    const mnemonic = localStorage.getItem(STORAGE_KEY);
    if (!mnemonic) return null;
    try {
        return deriveWallet(mnemonic);
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export function clearPersistedWallet(): void {
    localStorage.removeItem(STORAGE_KEY);
}
