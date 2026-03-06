import { useState, useMemo } from "react";
import { Scale, AlertCircle } from "lucide-react";
import { useNetwork } from "../context/NetworkContext.tsx";
import DisputeCard from "../components/DisputeCard.tsx";
import { InfiniteScroll } from "../components/InfiniteScroll.tsx";
import { useDisputes } from "../hooks/useDisputes.ts";

const STATUS_FILTERS = [
    { label: "All", value: -1 },
    { label: "Open", value: 0 },
    { label: "Countered", value: 1 },
    { label: "Voting", value: 2 },
    { label: "Resolved", value: 3 },
];

export default function DisputesPage() {
    const { connected, connecting } = useNetwork();
    const { items, loading, hasMore, loadMore, totalCount } = useDisputes();
    const [statusFilter, setStatusFilter] = useState(-1);

    const filtered = useMemo(
        () => statusFilter < 0 ? items : items.filter((d) => d.status === statusFilter),
        [items, statusFilter],
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-serif mb-2">Disputes</h1>
                <p className="text-text-secondary text-sm">
                    Browse and vote on open disputes across all applications.
                    {totalCount > 0 && (
                        <span className="text-text-tertiary"> · {totalCount} total</span>
                    )}
                </p>
            </div>

            <div className="flex gap-1 mb-8 border-b border-border">
                {STATUS_FILTERS.map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setStatusFilter(value)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                            statusFilter === value
                                ? "text-accent"
                                : "text-text-tertiary hover:text-text-secondary"
                        }`}
                    >
                        {label}
                        {statusFilter === value && (
                            <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-accent rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {connecting && (
                <div className="flex items-center justify-center py-20">
                    <span className="ml-3 text-text-secondary text-sm">Connecting to network...</span>
                </div>
            )}

            {!connecting && !connected && (
                <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <AlertCircle className="w-8 h-8 mb-3" />
                    <p className="text-sm">Not connected. Select a network to browse disputes.</p>
                </div>
            )}

            {connected && (
                <InfiniteScroll hasMore={hasMore} loading={loading} loadMore={loadMore} loadingText="Loading disputes...">
                    {filtered.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                            <Scale className="w-8 h-8 mb-3" />
                            <p className="text-sm">No disputes found{statusFilter >= 0 ? " matching this filter" : ""}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((d) => (
                                <DisputeCard key={`${d.contextId}-${d.disputeId}`} dispute={d} />
                            ))}
                        </div>
                    )}
                </InfiniteScroll>
            )}
        </div>
    );
}
