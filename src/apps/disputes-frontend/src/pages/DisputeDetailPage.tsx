import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, User, Scale, FileText, Vote } from "lucide-react";
import { Binary } from "polkadot-api";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useNetwork } from "../context/NetworkContext.tsx";
import StatusBadge, { statusLabel } from "../components/StatusBadge.tsx";
import VotingPanel from "../components/VotingPanel.tsx";

const REQUIRED_VOTES = 4;

interface DisputeDetail {
    status: number;
    voteCount: number;
    claimant: string;
    against: string;
    instructionIndex: number;
}

interface InstructionDetail {
    metadataUri: string;
    votingRuleId: number;
}

function truncateHex(hex: string): string {
    if (hex.length <= 14) return hex;
    return `${hex.slice(0, 8)}...${hex.slice(-4)}`;
}

function MetadataContent({
    uri,
    ipfsGatewayUrl,
    label,
}: {
    uri: string;
    ipfsGatewayUrl: string;
    label: string;
}) {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!uri) return;
        setLoading(true);
        const url = uri.startsWith("ipfs://") ? `${ipfsGatewayUrl}${uri.slice(7)}` : uri;

        fetch(url)
            .then((r) => r.text())
            .then((text) => setContent(text))
            .catch(() => setContent(null))
            .finally(() => setLoading(false));
    }, [uri, ipfsGatewayUrl]);

    if (!uri) return null;

    return (
        <div className="card mb-4">
            <h3 className="text-lg font-serif mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-tertiary" />
                {label}
            </h3>
            {loading ? (
                <div className="flex items-center gap-2 text-text-tertiary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading metadata...
                </div>
            ) : content ? (
                <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(content) as string),
                    }}
                />
            ) : (
                <p className="text-sm text-text-tertiary font-mono break-all">{uri}</p>
            )}
        </div>
    );
}

export default function DisputeDetailPage() {
    const { contextId, disputeId } = useParams<{ contextId: string; disputeId: string }>();
    const { disputes, connected, connecting, aliceAddress, ipfsGatewayUrl } = useNetwork();

    const [dispute, setDispute] = useState<DisputeDetail | null>(null);
    const [instruction, setInstruction] = useState<InstructionDetail | null>(null);
    const [hasVoted] = useState(false);
    const [voterValue] = useState<number | null>(null);
    const [decision, setDecision] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDispute = useCallback(async () => {
        if (!disputes || !contextId || !disputeId) return;
        setLoading(true);
        setError(null);

        try {
            const ctxBin = Binary.fromHex(contextId);
            const dispBin = Binary.fromHex(disputeId);

            const infoResult = await disputes.query("getDisputeInfo", {
                origin: aliceAddress,
                data: { context_id: ctxBin, dispute_id: dispBin },
            });

            if (!infoResult.success) {
                setError("Failed to load dispute");
                return;
            }

            const info = infoResult.value.response;
            setDispute({
                status: info.status,
                voteCount: Number(info.vote_count),
                claimant: info.claimant,
                against: info.against.asHex(),
                instructionIndex: Number(info.instruction_index),
            });

            // Fetch instruction
            const instrResult = await disputes.query("getInstruction", {
                origin: aliceAddress,
                data: { context_id: ctxBin, index: Number(info.instruction_index) },
            });

            if (instrResult.success) {
                const instr = instrResult.value.response;
                setInstruction({
                    metadataUri: instr.metadata_uri,
                    votingRuleId: Number(instr.voting_rule_id),
                });
            }

            // Fetch decision if resolved
            if (info.status === 3) {
                const decResult = await disputes.query("getDecision", {
                    origin: aliceAddress,
                    data: { context_id: ctxBin, dispute_id: dispBin },
                });
                if (decResult.success) {
                    setDecision(Number(decResult.value.response));
                }
            }
        } catch (err) {
            console.error("[DisputeDetailPage] load failed:", err);
            setError(err instanceof Error ? err.message : "Failed to load dispute");
        } finally {
            setLoading(false);
        }
    }, [disputes, contextId, disputeId, aliceAddress]);

    useEffect(() => {
        if (connected && disputes) loadDispute();
    }, [connected, disputes, loadDispute]);

    if (connecting || loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
                    <span className="ml-3 text-text-secondary">Loading dispute...</span>
                </div>
            </div>
        );
    }

    if (error || !dispute) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to disputes
                </Link>
                <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <AlertCircle className="w-8 h-8 mb-3" />
                    <p>{error || "Dispute not found"}</p>
                </div>
            </div>
        );
    }

    const voteProgress = Math.min(dispute.voteCount / REQUIRED_VOTES, 1);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to disputes
            </Link>

            {/* Header */}
            <div className="card mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-serif mb-1 flex items-center gap-3">
                            <Scale className="w-6 h-6 text-accent" />
                            Dispute Detail
                        </h1>
                        <p className="text-sm text-text-tertiary font-mono" title={disputeId}>
                            ID: {truncateHex(disputeId ?? "")}
                        </p>
                    </div>
                    <StatusBadge status={dispute.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-secondary rounded-xl p-4">
                        <div className="text-xs text-text-tertiary mb-1">Claimant</div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-secondary" />
                            <span className="font-mono text-sm" title={dispute.claimant}>
                                {truncateHex(dispute.claimant)}
                            </span>
                        </div>
                    </div>
                    <div className="bg-surface-secondary rounded-xl p-4">
                        <div className="text-xs text-text-tertiary mb-1">Against</div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-secondary" />
                            <span className="font-mono text-sm" title={dispute.against}>
                                {truncateHex(dispute.against)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                    <div className="text-xs text-text-tertiary mb-1">Context</div>
                    <span className="font-mono text-sm break-all">{contextId}</span>
                </div>

                <div className="flex items-center gap-3">
                    <Vote className="w-4 h-4 text-text-tertiary" />
                    <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${voteProgress * 100}%`,
                                backgroundColor:
                                    dispute.status === 3 ? "var(--success)" : "var(--color-accent)",
                            }}
                        />
                    </div>
                    <span className="text-sm text-text-secondary">
                        {dispute.voteCount}/{REQUIRED_VOTES} votes
                    </span>
                </div>
            </div>

            {/* Status timeline */}
            <div className="card mb-6">
                <h3 className="text-lg font-serif mb-4">Status Timeline</h3>
                <div className="flex items-center gap-0">
                    {["Open", "Countered", "Voting", "Resolved"].map((label, i) => (
                        <div key={label} className="flex items-center">
                            <div
                                className={`flex flex-col items-center ${i <= dispute.status ? "text-accent" : "text-text-tertiary"}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                        i < dispute.status
                                            ? "bg-accent text-white border-accent"
                                            : i === dispute.status
                                              ? "border-accent text-accent"
                                              : "border-border-strong"
                                    }`}
                                >
                                    {i < dispute.status ? "\u2713" : i + 1}
                                </div>
                                <span className="text-xs mt-1">{label}</span>
                            </div>
                            {i < 3 && (
                                <div
                                    className={`w-12 h-0.5 mx-1 ${i < dispute.status ? "bg-accent" : "bg-border-strong"}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Decision */}
            {dispute.status === 3 && decision !== null && (
                <div className="card mb-6">
                    <h3 className="text-lg font-serif mb-3">Decision</h3>
                    {instruction?.votingRuleId === 0 ? (
                        <div
                            className={`text-lg font-semibold ${decision === 1 ? "text-green-500" : "text-red-500"}`}
                        >
                            {decision === 1
                                ? "Ruled in favor of claimant"
                                : "Ruled in favor of defendant"}
                        </div>
                    ) : (
                        <div className="text-lg font-mono">Score: {decision} / 255</div>
                    )}
                </div>
            )}

            {/* Instruction info */}
            {instruction && (
                <MetadataContent
                    uri={instruction.metadataUri}
                    ipfsGatewayUrl={ipfsGatewayUrl}
                    label={`Instruction (${instruction.votingRuleId === 0 ? "Binary" : "Range"} Vote)`}
                />
            )}

            {/* Voting panel */}
            {dispute.status === 2 && instruction && (
                <VotingPanel
                    contextId={contextId!}
                    disputeId={disputeId!}
                    votingRuleId={instruction.votingRuleId}
                    hasVoted={hasVoted}
                    previousValue={voterValue}
                    onVoted={() => loadDispute()}
                />
            )}

            {dispute.status < 2 && (
                <div className="card text-center py-8">
                    <p className="text-text-secondary">
                        Voting has not started yet. Current status:{" "}
                        <strong>{statusLabel(dispute.status)}</strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
