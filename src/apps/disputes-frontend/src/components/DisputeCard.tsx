import { Link } from "react-router-dom";
import { Vote, User } from "lucide-react";
import StatusBadge from "./StatusBadge.tsx";

const REQUIRED_VOTES = 4;

export interface DisputeCardData {
    contextId: string;
    disputeId: string;
    status: number;
    voteCount: number;
    claimant: string;
    against: string;
    instructionIndex: number;
}

function truncateHex(hex: string): string {
    if (hex.length <= 14) return hex;
    return `${hex.slice(0, 8)}...${hex.slice(-4)}`;
}

export default function DisputeCard({ dispute }: { dispute: DisputeCardData }) {
    const voteProgress = Math.min(dispute.voteCount / REQUIRED_VOTES, 1);

    return (
        <Link
            to={`/disputes/${encodeURIComponent(dispute.contextId)}/${encodeURIComponent(dispute.disputeId)}`}
            className="card-hover block"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <div className="text-xs text-text-tertiary font-mono mb-1" title={dispute.contextId}>
                        Context: {truncateHex(dispute.contextId)}
                    </div>
                    <div className="text-sm font-medium text-text-primary truncate" title={dispute.disputeId}>
                        Dispute: {truncateHex(dispute.disputeId)}
                    </div>
                </div>
                <StatusBadge status={dispute.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
                <span className="flex items-center gap-1" title={dispute.claimant}>
                    <User className="w-3 h-3" />
                    {truncateHex(dispute.claimant)}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Vote className="w-3.5 h-3.5 text-text-tertiary" />
                <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${voteProgress * 100}%`,
                            backgroundColor: dispute.status === 3 ? "var(--success)" : "var(--color-accent)",
                        }}
                    />
                </div>
                <span className="text-xs text-text-tertiary whitespace-nowrap">
                    {dispute.voteCount}/{REQUIRED_VOTES}
                </span>
            </div>
        </Link>
    );
}
