export function extractError(err: unknown, fallback: string): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;

    if (err != null && typeof err === "object") {
        const tagged = err as { tag?: string; value?: { reason?: string } };
        if (typeof tagged.tag === "string") {
            const reason =
                tagged.value && typeof tagged.value.reason === "string"
                    ? tagged.value.reason
                    : undefined;
            return reason ? `${tagged.tag}: ${reason}` : tagged.tag;
        }

        const typed = err as { type?: string };
        if (typeof typed.type === "string") return `DispatchError: ${typed.type}`;

        const withMsg = err as { message?: unknown };
        if (typeof withMsg.message === "string") return withMsg.message;

        try {
            const json = JSON.stringify(err);
            if (json !== "{}") return json;
        } catch {
            /* ignore */
        }
    }

    return fallback;
}
