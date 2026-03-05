import { useState } from "react";
import { Check, X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useTransactions, type TrackedTransaction } from "../context/TransactionContext.tsx";

function StepIcon({ status }: { status: string }) {
    if (status === "completed") return <Check className="w-3.5 h-3.5 text-green-500" />;
    if (status === "failed") return <X className="w-3.5 h-3.5 text-red-500" />;
    if (status === "active") return <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />;
    return <div className="w-3.5 h-3.5 rounded-full border border-border-strong" />;
}

function TxItem({ tx, onDismiss }: { tx: TrackedTransaction; onDismiss: () => void }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="tx-item bg-surface border border-border rounded-xl p-3">
            <div className="flex items-center justify-between">
                <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    {tx.status === "active" && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                    {tx.status === "success" && <Check className="w-4 h-4 text-green-500" />}
                    {tx.status === "error" && <X className="w-4 h-4 text-red-500" />}
                    <span>{tx.label}</span>
                    {expanded ? <ChevronUp className="w-3.5 h-3.5 text-text-tertiary" /> : <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />}
                </button>
                <button onClick={onDismiss} className="text-text-tertiary hover:text-text-primary">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            {expanded && (
                <div className="mt-2 space-y-1">
                    {tx.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                            <StepIcon status={step.status} />
                            <span className={step.status === "active" ? "text-text-primary font-medium" : ""}>{step.label}</span>
                        </div>
                    ))}
                    {tx.error && <div className="text-xs text-red-500 mt-1 pl-5">{tx.error}</div>}
                </div>
            )}
        </div>
    );
}

export default function TransactionTracker() {
    const { transactions, dismissTransaction } = useTransactions();
    if (transactions.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2 tracker-expand">
            {transactions.map((tx) => (
                <TxItem key={tx.id} tx={tx} onDismiss={() => dismissTransaction(tx.id)} />
            ))}
        </div>
    );
}
