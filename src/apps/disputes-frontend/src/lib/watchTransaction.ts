import type { PolkadotSigner } from "polkadot-api";

const TX_TIMEOUT_MS = 120_000;

export async function watchTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    signer: PolkadotSigner,
): Promise<void> {
    let resolvedTx = tx;
    if (tx.waited && typeof tx.waited.then === "function") {
        resolvedTx = await tx.waited;
    }

    const result = await Promise.race([
        resolvedTx.signAndSubmit(signer, { mortality: { mortal: true, period: 256 } }),
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error("Transaction timed out after 120s.")),
                TX_TIMEOUT_MS,
            ),
        ),
    ]);

    if (result && "ok" in result && !result.ok) {
        throw new Error(`Transaction dispatch error: ${JSON.stringify(result.dispatchError)}`);
    }
}
