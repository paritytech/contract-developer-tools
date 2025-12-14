import { FixedSizeBinary } from "polkadot-api";

/**
 * Generates a random alphanumeric string of given length
 */
export function randomCode(len = 4): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}

/**
 * Mock function to convert a short string code (ex: `"ABCD"`) code into a FixedSizeBinary<32>.
 */
export function mockEntityId(code: string): FixedSizeBinary<32> {
    const enc = new TextEncoder();
    const bytes = new Uint8Array(32);
    const src = enc.encode(code.slice(0, 32));
    bytes.set(src);
    return new FixedSizeBinary(bytes);
}
