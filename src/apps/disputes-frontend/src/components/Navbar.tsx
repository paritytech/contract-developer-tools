import { useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Wifi, WifiOff, Loader2, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext.tsx";
import { useNetwork, NETWORK_PRESETS, mockAccounts } from "../context/NetworkContext.tsx";

function formatBalance(balance: bigint | null, decimals: number, symbol: string): string {
    if (balance === null) return "";
    const whole = balance / BigInt(10 ** decimals);
    const frac = balance % BigInt(10 ** decimals);
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2);
    return `${whole}.${fracStr} ${symbol}`;
}

function truncateAddress(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const {
        network, setNetwork, connected, connecting, error,
        loggedIn, signerAddress, signerName, balance,
        loginAs, logout, currentAccountIndex,
        tokenSymbol, tokenDecimals,
    } = useNetwork();

    const [networkOpen, setNetworkOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-2 font-semibold text-text-primary shrink-0">
                    <span className="text-lg font-serif">Disputes</span>
                </Link>

                <div className="flex items-center gap-3">
                    {/* Network selector */}
                    <div className="relative">
                        <button
                            onClick={() => { setNetworkOpen(!networkOpen); setAccountOpen(false); }}
                            className="btn-ghost flex items-center gap-2 text-sm"
                        >
                            {connecting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-text-tertiary" />
                            ) : connected ? (
                                <Wifi className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span>{network}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {networkOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-50">
                                {Object.keys(NETWORK_PRESETS).map((name) => (
                                    <button
                                        key={name}
                                        onClick={() => { setNetwork(name); setNetworkOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                                            name === network ? "text-accent font-medium" : "text-text-secondary"
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <span className="text-xs text-red-500 max-w-[200px] truncate" title={error}>{error}</span>
                    )}

                    {/* Account picker */}
                    {connected && (
                        <div className="relative">
                            {loggedIn ? (
                                <button
                                    onClick={() => { setAccountOpen(!accountOpen); setNetworkOpen(false); }}
                                    className="btn-ghost flex items-center gap-2 text-sm"
                                >
                                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono text-accent">
                                        {currentAccountIndex !== null ? currentAccountIndex : "H"}
                                    </div>
                                    <span className="font-mono text-xs">
                                        {signerName ?? truncateAddress(signerAddress ?? "")}
                                    </span>
                                    {balance !== null && (
                                        <span className="text-text-tertiary text-xs">
                                            {formatBalance(balance, tokenDecimals, tokenSymbol)}
                                        </span>
                                    )}
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setAccountOpen(!accountOpen); setNetworkOpen(false); }}
                                    className="btn-primary text-sm !py-2 !px-4"
                                >
                                    Connect
                                </button>
                            )}

                            {accountOpen && (
                                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[220px] z-50 max-h-[320px] overflow-y-auto">
                                    {mockAccounts.map((acct, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { loginAs(i); setAccountOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary transition-colors flex items-center gap-2 ${
                                                currentAccountIndex === i ? "text-accent font-medium" : "text-text-secondary"
                                            }`}
                                        >
                                            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono text-accent shrink-0">
                                                {i}
                                            </div>
                                            <span className="font-mono text-xs truncate">{truncateAddress(acct.address)}</span>
                                        </button>
                                    ))}
                                    {loggedIn && (
                                        <>
                                            <div className="border-t border-border my-1" />
                                            <button
                                                onClick={() => { logout(); setAccountOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-secondary transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={toggleTheme} className="btn-ghost !p-2">
                        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
