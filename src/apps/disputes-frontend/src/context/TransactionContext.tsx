import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

type StepStatus = "pending" | "active" | "completed" | "failed";

export interface TransactionStep {
    label: string;
    status: StepStatus;
}

export type TransactionStatus = "active" | "success" | "error";

export interface TrackedTransaction {
    id: string;
    label: string;
    status: TransactionStatus;
    steps: TransactionStep[];
    currentStepIndex: number;
    error?: string;
    createdAt: number;
}

interface TransactionContextType {
    transactions: TrackedTransaction[];
    startTransaction: (label: string, stepLabels: string[]) => string;
    advanceStep: (txId: string) => void;
    completeTransaction: (txId: string) => void;
    failTransaction: (txId: string, error: string) => void;
    dismissTransaction: (txId: string) => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export function useTransactions(): TransactionContextType {
    const ctx = useContext(TransactionContext);
    if (!ctx) throw new Error("useTransactions must be used within a TransactionProvider");
    return ctx;
}

export function TransactionProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<TrackedTransaction[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const startTransaction = useCallback((label: string, stepLabels: string[]): string => {
        const id = crypto.randomUUID();
        const steps: TransactionStep[] = stepLabels.map((s, i) => ({
            label: s,
            status: i === 0 ? "active" : "pending",
        }));
        setTransactions((prev) => [...prev, { id, label, status: "active", steps, currentStepIndex: 0, createdAt: Date.now() }]);
        return id;
    }, []);

    const advanceStep = useCallback((txId: string) => {
        setTransactions((prev) =>
            prev.map((tx) => {
                if (tx.id !== txId) return tx;
                const steps = tx.steps.map((s, i) => {
                    if (i === tx.currentStepIndex) return { ...s, status: "completed" as const };
                    if (i === tx.currentStepIndex + 1) return { ...s, status: "active" as const };
                    return s;
                });
                return { ...tx, steps, currentStepIndex: tx.currentStepIndex + 1 };
            }),
        );
    }, []);

    const dismissTransaction = useCallback((txId: string) => {
        const timer = timers.current.get(txId);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(txId);
        }
        setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
    }, []);

    const completeTransaction = useCallback(
        (txId: string) => {
            setTransactions((prev) =>
                prev.map((tx) => {
                    if (tx.id !== txId) return tx;
                    const steps = tx.steps.map((s) => ({ ...s, status: "completed" as const }));
                    return { ...tx, steps, status: "success" };
                }),
            );
            const timer = setTimeout(() => {
                timers.current.delete(txId);
                dismissTransaction(txId);
            }, 5000);
            timers.current.set(txId, timer);
        },
        [dismissTransaction],
    );

    const failTransaction = useCallback((txId: string, error: string) => {
        setTransactions((prev) =>
            prev.map((tx) => {
                if (tx.id !== txId) return tx;
                const steps = tx.steps.map((s, i) => {
                    if (i === tx.currentStepIndex) return { ...s, status: "failed" as const };
                    return s;
                });
                return { ...tx, steps, status: "error", error };
            }),
        );
    }, []);

    return (
        <TransactionContext.Provider
            value={{ transactions, startTransaction, advanceStep, completeTransaction, failTransaction, dismissTransaction }}
        >
            {children}
        </TransactionContext.Provider>
    );
}
