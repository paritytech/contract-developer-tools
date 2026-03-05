import { useState } from "react";
import { Binary } from "polkadot-api";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useNetwork } from "../context/NetworkContext.tsx";
import { useTransactions } from "../context/TransactionContext.tsx";
import { watchTransaction } from "../lib/watchTransaction.ts";
import { extractError } from "../lib/extractError.ts";

interface VotingPanelProps {
    contextId: string;
    disputeId: string;
    votingRuleId: number;
    hasVoted: boolean;
    previousValue: number | null;
    onVoted: () => void;
}

export default function VotingPanel({
    contextId,
    disputeId,
    votingRuleId,
    hasVoted,
    previousValue,
    onVoted,
}: VotingPanelProps) {
    const { disputes, signer, loggedIn, aliceAddress } = useNetwork();
    const { startTransaction, advanceStep, completeTransaction, failTransaction } = useTransactions();
    const [rangeValue, setRangeValue] = useState(previousValue ?? 128);
    const [submitting, setSubmitting] = useState(false);

    const castVote = async (value: number) => {
        if (!disputes || !signer || submitting) return;
        setSubmitting(true);

        const txId = startTransaction(
            hasVoted ? "Updating vote" : "Casting vote",
            ["Signing transaction", "Submitting to chain"],
        );

        try {
            advanceStep(txId);
            const tx = disputes.send("castVote", {
                origin: aliceAddress,
                data: { context_id: Binary.fromHex(contextId), dispute_id: Binary.fromHex(disputeId), value },
            });

            await watchTransaction(tx, signer);
            completeTransaction(txId);
            onVoted();
        } catch (err) {
            failTransaction(txId, extractError(err, "Vote failed"));
        } finally {
            setSubmitting(false);
        }
    };

    if (!loggedIn) {
        return (
            <div className="card text-center py-8">
                <p className="text-text-secondary">Connect an account to vote on this dispute.</p>
            </div>
        );
    }

    if (votingRuleId === 0) {
        return (
            <div className="card">
                <h3 className="text-lg font-serif mb-4">
                    {hasVoted ? "Update Your Vote" : "Cast Your Vote"}
                </h3>
                {hasVoted && previousValue !== null && (
                    <p className="text-sm text-text-tertiary mb-3">
                        Current vote: {previousValue === 1 ? "Yes (claimant)" : "No (defendant)"}
                    </p>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={() => castVote(1)}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                                   bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                        Yes (Claimant)
                    </button>
                    <button
                        onClick={() => castVote(0)}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                                   bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                        No (Defendant)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="text-lg font-serif mb-4">
                {hasVoted ? "Update Your Vote" : "Cast Your Vote"}
            </h3>
            {hasVoted && previousValue !== null && (
                <p className="text-sm text-text-tertiary mb-3">Current vote: {previousValue}</p>
            )}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-text-tertiary mb-2">
                    <span>0 (Defendant)</span>
                    <span className="font-mono text-text-primary font-medium">{rangeValue}</span>
                    <span>255 (Claimant)</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={255}
                    value={rangeValue}
                    onChange={(e) => setRangeValue(Number(e.target.value))}
                    className="w-full accent-accent"
                />
            </div>
            <button
                onClick={() => castVote(rangeValue)}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {hasVoted ? "Update Vote" : "Submit Vote"}
            </button>
        </div>
    );
}
