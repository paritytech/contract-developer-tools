import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { createClient, type PolkadotClient, type TypedApi } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import {
    contracts,
    bulletin as bulletinDescriptor,
    assethub as assethubDescriptor,
} from "@polkadot-api/descriptors";
import { createInkSdk, type ContractSdk } from "@polkadot-api/sdk-ink";
import {
    deriveWallet,
    getAliceAddress,
    persistWallet,
    loadPersistedWallet,
    clearPersistedWallet,
    type Signer,
} from "../lib/wallet.ts";
import { ss58ToEthereum } from "@polkadot-api/sdk-ink";
import mockAccountsData from "../data/mock-accounts.json";
import {
    isInHost,
    getHostAccounts,
    subscribeConnectionStatus,
} from "../lib/host/index.ts";

// ---------------------------------------------------------------------------
// Network presets
// ---------------------------------------------------------------------------

interface NetworkPreset {
    assethubUrl: string | string[];
    bulletinUrl: string;
    ipfsGatewayUrl: string;
    registryAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
}

const NETWORK_PRESETS: Record<string, NetworkPreset> = {
    "preview-net": {
        assethubUrl: "wss://previewnet.substrate.dev/asset-hub",
        bulletinUrl: "wss://previewnet.substrate.dev/bulletin",
        ipfsGatewayUrl: "https://previewnet.substrate.dev/ipfs/",
        registryAddress: "0xcf5f4af8f99f361a620fffa8ed3a62742bd8876d",
        tokenSymbol: "WND",
        tokenDecimals: 12,
    },
    paseo: {
        assethubUrl: [
            "wss://asset-hub-paseo-rpc.n.dwellir.com",
            "wss://sys.ibp.network/asset-hub-paseo",
            "wss://asset-hub-paseo.dotters.network",
        ],
        bulletinUrl: "wss://paseo-bulletin-rpc.polkadot.io",
        ipfsGatewayUrl: "https://paseo-ipfs.polkadot.io/ipfs",
        registryAddress: "0xede6d5f092de34152f8952baa99a35363ed087c0",
        tokenSymbol: "PAS",
        tokenDecimals: 10,
    },
    local: {
        assethubUrl: "ws://127.0.0.1:10020",
        bulletinUrl: "ws://127.0.0.1:10030",
        ipfsGatewayUrl: "http://127.0.0.1:8080/ipfs",
        registryAddress: "",
        tokenSymbol: "WND",
        tokenDecimals: 12,
    },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DisputesContract = ContractSdk<typeof contracts.disputes>;
type BulletinApi = TypedApi<typeof bulletinDescriptor>;
type AssethubApi = TypedApi<typeof assethubDescriptor>;

export interface MockAccount {
    mnemonic: string;
    address: string;
    ethAddress: string;
}

const mockAccounts: MockAccount[] = mockAccountsData.accounts as MockAccount[];

export interface NetworkContextType {
    network: string;
    setNetwork: (name: string) => void;
    connected: boolean;
    connecting: boolean;
    error: string | null;
    ipfsGatewayUrl: string;
    tokenSymbol: string;
    tokenDecimals: number;

    disputes: DisputesContract | null;
    bulletinApi: BulletinApi | null;

    loggedIn: boolean;
    signer: Signer | null;
    signerAddress: string | null;
    signerName: string | null;
    ethAddress: string | null;
    balance: bigint | null;
    loginAs: (accountIndex: number) => void;
    logout: () => void;
    currentAccountIndex: number | null;

    hostMode: boolean;
    aliceAddress: string;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function useNetwork(): NetworkContextType {
    const ctx = useContext(NetworkContext);
    if (!ctx) throw new Error("useNetwork must be used within a NetworkProvider");
    return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const DEFAULT_NETWORK = "paseo";

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [network, setNetworkState] = useState(DEFAULT_NETWORK);
    const preset = NETWORK_PRESETS[network];

    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [disputes, setDisputes] = useState<DisputesContract | null>(null);
    const [bulletinApi, setBulletinApi] = useState<BulletinApi | null>(null);
    const assethubApiRef = useRef<AssethubApi | null>(null);

    const [hostMode, setHostMode] = useState(
        () => isInHost() || localStorage.getItem("disputes-wallet") === "host",
    );

    const [loggedIn, setLoggedIn] = useState(false);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [signerAddress, setSignerAddress] = useState<string | null>(null);
    const [signerName, setSignerName] = useState<string | null>(null);
    const [ethAddress, setEthAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<bigint | null>(null);
    const [currentAccountIndex, setCurrentAccountIndex] = useState<number | null>(null);

    const clientsRef = useRef<{ assethub: PolkadotClient; bulletin: PolkadotClient } | null>(null);
    const aliceAddress = getAliceAddress();

    // -----------------------------------------------------------------------
    // Connect to chains
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (!preset.assethubUrl || !preset.registryAddress) return;
        const registryAddress = preset.registryAddress;

        let cancelled = false;

        const connect = async () => {
            if (clientsRef.current) {
                clientsRef.current.assethub.destroy();
                clientsRef.current.bulletin.destroy();
                clientsRef.current = null;
            }

            setConnecting(true);
            setConnected(false);
            setError(null);
            setDisputes(null);
            setBulletinApi(null);

            try {
                const assethubRpcs = Array.isArray(preset.assethubUrl)
                    ? preset.assethubUrl
                    : [preset.assethubUrl];
                const assethubClient = createClient(getWsProvider(assethubRpcs));
                const bulletinClient = createClient(getWsProvider(preset.bulletinUrl));

                const CONNECTION_TIMEOUT_MS = 15_000;
                await Promise.race([
                    assethubClient.getChainSpecData(),
                    new Promise<never>((_, reject) =>
                        setTimeout(
                            () => reject(new Error(`Connection timed out after ${CONNECTION_TIMEOUT_MS / 1000}s`)),
                            CONNECTION_TIMEOUT_MS,
                        ),
                    ),
                ]);

                if (cancelled) return;

                // Resolve disputes contract address from on-chain registry
                const inkSdk = createInkSdk(assethubClient, { atBest: true });
                const registry = inkSdk.getContract(
                    contracts.contractsRegistry,
                    registryAddress,
                );

                const disputesResult = await registry.query("getAddress", {
                    origin: aliceAddress,
                    data: { contract_name: "@polkadot/disputes" },
                });

                if (cancelled) return;

                if (!disputesResult.success || !disputesResult.value.response.isSome) {
                    throw new Error("Disputes contract not found in on-chain registry");
                }

                const disputesAddr = disputesResult.value.response.value;

                const ahApi = assethubClient.getTypedApi(assethubDescriptor);
                const blApi = bulletinClient.getTypedApi(bulletinDescriptor);

                const disputesContract = inkSdk.getContract(contracts.disputes, disputesAddr);

                clientsRef.current = { assethub: assethubClient, bulletin: bulletinClient };
                assethubApiRef.current = ahApi;

                setDisputes(disputesContract);
                setBulletinApi(blApi);
                setConnected(true);
                setConnecting(false);

                // Auto-connect host or restore persisted wallet
                if (isInHost() || localStorage.getItem("disputes-wallet") === "host") {
                    let hostConnected = false;
                    try {
                        const accounts = await getHostAccounts();
                        if (cancelled) return;
                        if (accounts.length > 0) {
                            const acct = accounts[0];
                            setSigner(acct.polkadotSigner as Signer);
                            setSignerAddress(acct.address);
                            setSignerName(acct.name ?? null);
                            setEthAddress(ss58ToEthereum(acct.address).asHex());
                            setLoggedIn(true);
                            localStorage.setItem("disputes-wallet", "host");
                            hostConnected = true;
                        }
                    } catch (err) {
                        console.warn("[host] Auto-connect failed:", err);
                    }
                    if (!hostConnected && !cancelled) {
                        setHostMode(false);
                        localStorage.removeItem("disputes-wallet");
                    }
                } else {
                    const persisted = loadPersistedWallet();
                    if (persisted) {
                        const idx = mockAccounts.findIndex((a) => a.address === persisted.address);
                        setSigner(persisted.signer);
                        setSignerAddress(persisted.address);
                        setEthAddress(ss58ToEthereum(persisted.address).asHex());
                        setLoggedIn(true);
                        if (idx >= 0) setCurrentAccountIndex(idx);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    if (clientsRef.current) {
                        clientsRef.current.assethub.destroy();
                        clientsRef.current.bulletin.destroy();
                        clientsRef.current = null;
                    }
                    setError(err instanceof Error ? err.message : "Connection failed");
                    setConnecting(false);
                }
            }
        };

        connect();

        return () => {
            cancelled = true;
            if (clientsRef.current) {
                clientsRef.current.assethub.destroy();
                clientsRef.current.bulletin.destroy();
                clientsRef.current = null;
            }
        };
    }, [network]);

    // Host connection status
    useEffect(() => {
        if (!hostMode) return;
        const unsub = subscribeConnectionStatus((status) => {
            if (status === "disconnected" && loggedIn) {
                setSigner(null);
                setSignerAddress(null);
                setSignerName(null);
                setEthAddress(null);
                setLoggedIn(false);
                setBalance(null);
            }
        });
        return unsub;
    }, [hostMode, loggedIn]);

    // Balance polling
    useEffect(() => {
        if (!signerAddress || !assethubApiRef.current) {
            setBalance(null);
            return;
        }

        let cancelled = false;
        const api = assethubApiRef.current;

        const fetchBalance = async () => {
            try {
                const acct = await api.query.System.Account.getValue(signerAddress);
                if (!cancelled) setBalance(acct.data.free);
            } catch {
                /* ignore */
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 12_000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [signerAddress, connected]);

    const loginAs = useCallback((accountIndex: number) => {
        const account = mockAccounts[accountIndex];
        if (!account) return;
        const wallet = deriveWallet(account.mnemonic);
        persistWallet(account.mnemonic);
        setSigner(wallet.signer);
        setSignerAddress(wallet.address);
        setEthAddress(ss58ToEthereum(wallet.address).asHex());
        setLoggedIn(true);
        setCurrentAccountIndex(accountIndex);
    }, []);

    const logout = useCallback(() => {
        clearPersistedWallet();
        setSigner(null);
        setSignerAddress(null);
        setSignerName(null);
        setEthAddress(null);
        setLoggedIn(false);
        setCurrentAccountIndex(null);
        setHostMode(false);
    }, []);

    const setNetwork = useCallback(
        (name: string) => {
            if (name === network || !NETWORK_PRESETS[name]) return;
            logout();
            setNetworkState(name);
        },
        [network, logout],
    );

    return (
        <NetworkContext.Provider
            value={{
                network,
                setNetwork,
                connected,
                connecting,
                error,
                ipfsGatewayUrl: preset.ipfsGatewayUrl,
                tokenSymbol: preset.tokenSymbol,
                tokenDecimals: preset.tokenDecimals,
                disputes,
                bulletinApi,
                loggedIn,
                signer,
                signerAddress,
                signerName,
                ethAddress,
                balance,
                loginAs,
                logout,
                currentAccountIndex,
                hostMode,
                aliceAddress,
            }}
        >
            {children}
        </NetworkContext.Provider>
    );
}

export { NETWORK_PRESETS, mockAccounts };
