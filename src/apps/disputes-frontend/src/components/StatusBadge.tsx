const STATUS_MAP: Record<number, { label: string; className: string }> = {
    0: { label: "Open", className: "badge-warning" },
    1: { label: "Countered", className: "badge" },
    2: { label: "Voting", className: "badge-info" },
    3: { label: "Resolved", className: "badge-success" },
};

export default function StatusBadge({ status }: { status: number }) {
    const info = STATUS_MAP[status] ?? { label: `Unknown (${status})`, className: "badge" };
    return <span className={info.className}>{info.label}</span>;
}

export function statusLabel(status: number): string {
    return STATUS_MAP[status]?.label ?? `Unknown (${status})`;
}
