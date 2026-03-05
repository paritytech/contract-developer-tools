import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, User, FileText, Vote } from "lucide-react";
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
    claimUri: string;
    counterClaimUri: string;
    resolutionUri: string;
}

interface InstructionDetail {
    metadataUri: string;
    votingRuleId: number;
}

function truncateHex(hex: string): string {
    if (hex.length <= 14) return hex;
    return `${hex.slice(0, 8)}...${hex.slice(-4)}`;
}

interface ParsedMetadata {
    description: string;
    images: string[];
}

function resolveIpfsUrl(uri: string, gateway: string): string {
    return uri.startsWith("ipfs://") ? `${gateway}${uri.slice(7)}` : uri;
}

function parseMetadata(text: string): ParsedMetadata {
    try {
        const json = JSON.parse(text);
        if (typeof json.description === "string") {
            return {
                description: json.description,
                images: Array.isArray(json.images) ? json.images : [],
            };
        }
    } catch {
        // not JSON — treat entire text as markdown
    }
    return { description: text, images: [] };
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
    const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!uri) return;
        setLoading(true);
        const url = resolveIpfsUrl(uri, ipfsGatewayUrl);

        fetch(url)
            .then((r) => r.text())
            .then((text) => setMetadata(parseMetadata(text)))
            .catch(() => setMetadata(null))
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
            ) : metadata ? (
                <>
                    <div
                        className="markdown-preview"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(marked.parse(metadata.description) as string),
                        }}
                    />
                    {metadata.images.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            {metadata.images.map((cid) => (
                                <a
                                    key={cid}
                                    href={resolveIpfsUrl(`ipfs://${cid}`, ipfsGatewayUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={resolveIpfsUrl(`ipfs://${cid}`, ipfsGatewayUrl)}
                                        alt="Evidence"
                                        className="rounded-lg border border-border-strong max-h-60 object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                </>
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
                claimUri: info.claim_uri,
                counterClaimUri: info.counter_claim_uri,
                resolutionUri: info.resolution_uri,
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
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-5 h-5 animate-spin text-accent/50" />
                    <span className="ml-3 text-text-secondary text-sm">Loading dispute...</span>
                </div>
            </div>
        );
    }

    if (error || !dispute) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
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
        <div className="max-w-4xl mx-auto px-4 py-10">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to disputes
            </Link>

            {/* Header */}
            <div className="card mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-serif mb-1">Dispute Detail</h1>
                        <p className="text-xs text-text-tertiary font-mono" title={disputeId}>
                            {truncateHex(disputeId ?? "")}
                        </p>
                    </div>
                    <StatusBadge status={dispute.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-surface-secondary rounded-lg p-4 border-l-2 border-accent/15">
                        <div className="text-[11px] text-text-tertiary mb-1 uppercase tracking-wider">Claimant</div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-tertiary" />
                            <span className="font-mono text-sm" title={dispute.claimant}>
                                {truncateHex(dispute.claimant)}
                            </span>
                        </div>
                    </div>
                    <div className="bg-surface-secondary rounded-lg p-4 border-l-2 border-accent/15">
                        <div className="text-[11px] text-text-tertiary mb-1 uppercase tracking-wider">Against</div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-tertiary" />
                            <span className="font-mono text-sm" title={dispute.against}>
                                {truncateHex(dispute.against)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 mb-4 border-l-2 border-accent/15">
                    <div className="text-[11px] text-text-tertiary mb-1 uppercase tracking-wider">Context</div>
                    <span className="font-mono text-sm break-all">{contextId}</span>
                </div>

                <div className="flex items-center gap-3">
                    <Vote className="w-4 h-4 text-text-tertiary" />
                    <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${voteProgress * 100}%`,
                                backgroundColor:
                                    dispute.status === 3 ? "var(--success)" : "var(--color-accent)",
                            }}
                        />
                    </div>
                    <span className="text-sm text-text-secondary font-mono tabular-nums">
                        {dispute.voteCount}/{REQUIRED_VOTES}
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
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
                                        i < dispute.status
                                            ? "bg-accent text-white border-accent"
                                            : i === dispute.status
                                              ? "border-accent text-accent"
                                              : "border-border-strong"
                                    }`}
                                >
                                    {i < dispute.status ? "\u2713" : i + 1}
                                </div>
                                <span className="text-xs mt-1.5 font-medium">{label}</span>
                            </div>
                            {i < 3 && (
                                <div
                                    className={`w-12 h-0.5 mx-1 rounded-full ${i < dispute.status ? "bg-accent" : "bg-border-strong"}`}
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
                            className={`text-lg font-semibold ${decision === 1 ? "text-emerald-500" : "text-red-500"}`}
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

            {/* Claimant's evidence */}
            {dispute.claimUri && (
                <MetadataContent
                    uri={dispute.claimUri}
                    ipfsGatewayUrl={ipfsGatewayUrl}
                    label="Claimant's Evidence"
                />
            )}

            {/* Counter-evidence */}
            {dispute.counterClaimUri && (
                <MetadataContent
                    uri={dispute.counterClaimUri}
                    ipfsGatewayUrl={ipfsGatewayUrl}
                    label="Counter-Evidence"
                />
            )}

            {/* Resolution */}
            {dispute.resolutionUri && (
                <MetadataContent
                    uri={dispute.resolutionUri}
                    ipfsGatewayUrl={ipfsGatewayUrl}
                    label="Resolution"
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
                    <p className="text-text-secondary text-sm">
                        Voting has not started yet. Current status:{" "}
                        <strong className="text-text-primary">{statusLabel(dispute.status)}</strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
