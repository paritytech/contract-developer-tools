import { createClient, PolkadotClient, TypedApi } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { AssetHub, assetHub } from "@polkadot-api/descriptors";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";

export interface Connection {
    client: PolkadotClient;
    api: TypedApi<AssetHub>;
}

/**
 * Detect connection type from URL.
 * - ws:// or wss:// -> WebSocket
 * - file path -> smoldot with chainspec
 */
export function detectConnectionType(url: string): "websocket" | "smoldot" {
    if (url.startsWith("ws://") || url.startsWith("wss://")) {
        return "websocket";
    }
    return "smoldot";
}

/**
 * Connect to a chain via WebSocket.
 */
export function connectWebSocket(url: string): Connection {
    const client = createClient(withPolkadotSdkCompat(getWsProvider(url)));
    return { client, api: client.getTypedApi(assetHub) };
}

/**
 * Try to find a relay chain chainspec relative to a parachain chainspec.
 * Looks for common naming patterns.
 */
function findRelayChainspec(parachainPath: string, relayChainName: string): string | null {
    const dir = dirname(parachainPath);

    // Common naming patterns for relay chain chainspecs
    const candidates = [
        join(dir, `${relayChainName}.json`),
        join(dir, `${relayChainName}-local.json`),
        join(dir, "relay.json"),
        join(dir, "relay-chain.json"),
        join(dir, "westend-local.json"),
        join(dir, "rococo-local.json"),
    ];

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

/**
 * Connect to a chain via smoldot light client.
 *
 * @param chainspecPath - Path to the chainspec JSON file
 * @param relayChainspecPath - Optional path to relay chain chainspec (for parachains)
 */
export async function connectSmoldot(
    chainspecPath: string,
    relayChainspecPath?: string,
): Promise<Connection> {
    const smoldot = start();
    const chainSpec = readFileSync(chainspecPath, "utf-8");

    // Check if this is a parachain (has relay_chain field)
    const parsed = JSON.parse(chainSpec);
    const isParachain = !!parsed.relay_chain;

    if (isParachain) {
        // Find relay chain chainspec
        let relayPath = relayChainspecPath;
        if (!relayPath) {
            relayPath = findRelayChainspec(chainspecPath, parsed.relay_chain) ?? undefined;
        }

        if (!relayPath) {
            throw new Error(
                `Parachain chainspec requires relay chain. ` +
                `Could not find chainspec for "${parsed.relay_chain}". ` +
                `Please provide --relay-chainspec option.`
            );
        }

        const relaySpec = readFileSync(relayPath, "utf-8");
        const relayChain = await smoldot.addChain({ chainSpec: relaySpec });
        const parachain = await smoldot.addChain({
            chainSpec,
            potentialRelayChains: [relayChain],
        });

        const client = createClient(getSmProvider(parachain));
        return { client, api: client.getTypedApi(assetHub) };
    }

    // Standalone chain
    const chain = await smoldot.addChain({ chainSpec });
    const client = createClient(getSmProvider(chain));
    return { client, api: client.getTypedApi(assetHub) };
}

/**
 * Create a connection to a chain.
 * Auto-detects WebSocket vs smoldot based on the URL.
 */
export async function createConnection(
    url: string,
    relayChainspecPath?: string,
): Promise<Connection> {
    const type = detectConnectionType(url);

    if (type === "websocket") {
        return connectWebSocket(url);
    } else {
        return connectSmoldot(url, relayChainspecPath);
    }
}
