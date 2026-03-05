import { useState, useEffect, useCallback, useRef } from "react";
import { Scale, Loader2, AlertCircle } from "lucide-react";
import { useNetwork } from "../context/NetworkContext.tsx";
import DisputeCard, { type DisputeCardData } from "../components/DisputeCard.tsx";

const PAGE_SIZE = 12;

const STATUS_FILTERS = [
    { label: "All", value: -1 },
    { label: "Open", value: 0 },
    { label: "Countered", value: 1 },
    { label: "Voting", value: 2 },
    { label: "Resolved", value: 3 },
];

export default function DisputesPage() {
    const { disputes, connected, connecting, aliceAddress } = useNetwork();
    const [items, setItems] = useState<DisputeCardData[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState(-1);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const nextIndexRef = useRef<number | null>(null);
    const hasMoreRef = useRef(true);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset when contract or filter changes
    useEffect(() => {
        setItems([]);
        nextIndexRef.current = null;
        hasMoreRef.current = true;
        setTotalCount(null);
    }, [disputes, statusFilter]);

    const loadMore = useCallback(async () => {
        if (!disputes || loading || !hasMoreRef.current) return;
        setLoading(true);

        try {
            let total = totalCount;
            if (total === null) {
                const countResult = await disputes.query("getTotalDisputeCount", {
                    origin: aliceAddress,
                    data: {},
                });
                total = countResult.success ? Number(countResult.value.response) : 0;
                setTotalCount(total);
            }

            if (total === 0) {
                hasMoreRef.current = false;
                setLoading(false);
                return;
            }

            const startIdx = nextIndexRef.current ?? total - 1;
            const batch: DisputeCardData[] = [];
            let idx = startIdx;
            let fetched = 0;

            while (idx >= 0 && batch.length < PAGE_SIZE) {
                if (fetched >= PAGE_SIZE * 4) break;
                fetched++;

                try {
                    const refResult = await disputes.query("getDisputeAt", {
                        origin: aliceAddress,
                        data: { index: idx },
                    });
                    idx--;

                    if (!refResult.success) continue;
                    const ref = refResult.value.response;

                    const infoResult = await disputes.query("getDisputeInfo", {
                        origin: aliceAddress,
                        data: {
                            context_id: ref.context_id,
                            dispute_id: ref.dispute_id,
                        },
                    });

                    if (!infoResult.success) continue;
                    const info = infoResult.value.response;

                    if (statusFilter >= 0 && info.status !== statusFilter) continue;

                    batch.push({
                        contextId: ref.context_id.asHex(),
                        disputeId: ref.dispute_id.asHex(),
                        status: info.status,
                        voteCount: Number(info.vote_count),
                        claimant: info.claimant,
                        against: info.against.asHex(),
                        instructionIndex: Number(info.instruction_index),
                    });
                } catch {
                    idx--;
                }
            }

            nextIndexRef.current = idx;
            hasMoreRef.current = idx >= 0;
            setItems((prev) => [...prev, ...batch]);
        } catch (err) {
            console.error("[DisputesPage] loadMore failed:", err);
        } finally {
            setLoading(false);
        }
    }, [disputes, loading, totalCount, statusFilter, aliceAddress]);

    // Trigger initial load
    useEffect(() => {
        if (connected && disputes && items.length === 0 && !loading) {
            loadMore();
        }
    }, [connected, disputes, items.length, loading, loadMore]);

    // Infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreRef.current && !loading) {
                    loadMore();
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore, loading]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-serif mb-2">Disputes</h1>
                <p className="text-text-secondary text-sm">
                    Browse and vote on open disputes across all applications.
                    {totalCount !== null && (
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
                    <Loader2 className="w-5 h-5 animate-spin text-accent/50" />
                    <span className="ml-3 text-text-secondary text-sm">Connecting to network...</span>
                </div>
            )}

            {!connecting && !connected && (
                <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <AlertCircle className="w-8 h-8 mb-3" />
                    <p className="text-sm">Not connected. Select a network to browse disputes.</p>
                </div>
            )}

            {connected && items.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <Scale className="w-8 h-8 mb-3" />
                    <p className="text-sm">No disputes found{statusFilter >= 0 ? " matching this filter" : ""}.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((d) => (
                    <DisputeCard key={`${d.contextId}-${d.disputeId}`} dispute={d} />
                ))}
            </div>

            <div ref={sentinelRef} className="h-1" />

            {loading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-accent/50" />
                </div>
            )}
        </div>
    );
}
