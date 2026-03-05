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

const STATUS_ACCENT: Record<number, string> = {
    0: "var(--warning)",
    1: "var(--color-border-strong)",
    2: "var(--color-accent)",
    3: "var(--success)",
};

function truncateHex(hex: string): string {
    if (hex.length <= 14) return hex;
    return `${hex.slice(0, 8)}...${hex.slice(-4)}`;
}

export default function DisputeCard({ dispute }: { dispute: DisputeCardData }) {
    const voteProgress = Math.min(dispute.voteCount / REQUIRED_VOTES, 1);
    const accentColor = STATUS_ACCENT[dispute.status] ?? "var(--color-border)";

    return (
        <Link
            to={`/disputes/${encodeURIComponent(dispute.contextId)}/${encodeURIComponent(dispute.disputeId)}`}
            className="card-hover block relative overflow-hidden"
        >
            <div
                className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                style={{ backgroundColor: accentColor }}
            />

            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <div className="text-[11px] text-text-tertiary font-mono mb-1 uppercase tracking-wider" title={dispute.contextId}>
                        {truncateHex(dispute.contextId)}
                    </div>
                    <div className="text-sm font-medium text-text-primary truncate" title={dispute.disputeId}>
                        {truncateHex(dispute.disputeId)}
                    </div>
                </div>
                <StatusBadge status={dispute.status} />
            </div>

            <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
                <span className="flex items-center gap-1.5" title={dispute.claimant}>
                    <User className="w-3 h-3 text-text-tertiary" />
                    <span className="font-mono">{truncateHex(dispute.claimant)}</span>
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Vote className="w-3.5 h-3.5 text-text-tertiary" />
                <div className="flex-1 h-1 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${voteProgress * 100}%`,
                            backgroundColor: dispute.status === 3 ? "var(--success)" : "var(--color-accent)",
                        }}
                    />
                </div>
                <span className="text-xs text-text-tertiary font-mono tabular-nums">
                    {dispute.voteCount}/{REQUIRED_VOTES}
                </span>
            </div>
        </Link>
    );
}
