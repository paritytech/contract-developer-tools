import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToU8a } from "@polkadot/util";

const addresses: Record<string, string> = {
    CONTEXTS: "0xf2095f6aa01f329d113c0ef984fc11d1f9932cab",
    CONTRACTS: "0x08fa8ed21b5dce51cf7d41b8998a3c3bc143a40c",
    REPUTATION: "0xbd94eb5fdc31ef0e54dca45284fe779165ecaaed",
    DISPUTES: "0x03158c7213e2ae8b11f77d02ca15e6e6805b40d5",
    ENTITY_GRAPH: "0x2aba801378d4fa50ede1730e0e89045a8823db20",
};

async function main() {
    const api = await ApiPromise.create({
        provider: new WsProvider("ws://127.0.0.1:10020")
    });

    console.log("Querying contracts on chain...\n");

    for (const [name, addr] of Object.entries(addresses)) {
        try {
            // Query using accountInfoOf with 20-byte address
            const addrBytes = hexToU8a(addr);
            const info = await (api.query.revive as any).accountInfoOf(addrBytes);

            if (info && !info.isEmpty && info.isSome) {
                const data = info.unwrap();
                console.log("✓ " + name + ": " + addr);
                console.log("  " + JSON.stringify(data.toHuman()));
            } else if (info && !info.isEmpty) {
                console.log("✓ " + name + ": " + addr);
                console.log("  " + JSON.stringify(info.toHuman()));
            } else {
                console.log("? " + name + ": " + addr + " - empty/none");
            }
        } catch (e: any) {
            console.log("✗ " + name + ": " + addr);
            console.log("  ERROR: " + e.message.slice(0, 100));
        }
    }

    await api.disconnect();
}

main().catch(console.error);
