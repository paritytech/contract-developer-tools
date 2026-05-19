// Integration test for the contexts contract on a local chain.
//
// Prerequisites:
//   1. A revive-enabled local node with Asset Hub at ws://127.0.0.1:10020
//      (e.g. a zombienet polkadot fork).
//   2. Contracts deployed to that node:
//        cdm deploy --bootstrap --name local --suri //Alice
//      This adds a `local` target to cdm.json with deployed addresses.
//   3. Run: bun run test:contexts
//      Override target with CDM_TARGET_HASH=<hash> if your local target uses
//      a non-127.0.0.1 endpoint.
//
// What's covered:
//   - register_context(ctx, owner, operator) sets both roles
//   - is_authorized / is_owner return true for owner OR operator
//   - add_operator / remove_operator gated on owner
//   - transfer_owner gated on owner; rotates authority
//   - NotOwner reverts from non-owner callers

import { createCdmFromFile } from "@dotdm/cdm";
import { seedToAccount } from "@parity/product-sdk-keys";
import { DEV_PHRASE } from "@polkadot-labs/hdkd-helpers";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import type { PolkadotSigner } from "polkadot-api";

const LOCAL_WS_PATTERN = "ws://127.0.0.1";

interface DevAccount {
    name: string;
    h160: `0x${string}`;
    ss58: string;
    signer: PolkadotSigner;
}

function devAccount(name: string, path: string): DevAccount {
    const acct = seedToAccount(DEV_PHRASE, path);
    return { name, h160: acct.h160Address, ss58: acct.ss58Address, signer: acct.signer };
}

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string) {
    if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
        failed++;
    }
}

async function expectRevert(
    label: string,
    fn: () => Promise<{ ok: boolean }>,
) {
    try {
        const result = await fn();
        check(label, !result.ok, `tx reported ok=${result.ok}`);
    } catch (err) {
        // Pre-submit dry-run failure also counts as a revert.
        check(label, true);
    }
}

async function expectOk(label: string, fn: () => Promise<{ ok: boolean }>) {
    try {
        const result = await fn();
        check(label, result.ok, "tx reported ok=false");
    } catch (err) {
        check(label, false, String(err));
    }
}

// Pick the local target from cdm.json by URL prefix. Override with
// CDM_TARGET_HASH if the local target uses a non-127.0.0.1 endpoint.
function selectTargetHash(): string {
    const override = process.env.CDM_TARGET_HASH;
    if (override) return override;
    const cdmJsonPath = new URL("../cdm.json", import.meta.url);
    const json = JSON.parse(readFileSync(cdmJsonPath, "utf8")) as {
        targets: Record<string, { "asset-hub": string }>;
    };
    for (const [hash, t] of Object.entries(json.targets)) {
        if (t["asset-hub"].startsWith(LOCAL_WS_PATTERN)) return hash;
    }
    throw new Error(
        `No local target (asset-hub starting with ${LOCAL_WS_PATTERN}) found in cdm.json.\n` +
        `Run: cdm deploy --bootstrap --name local --suri //Alice`,
    );
}

const Alice = devAccount("Alice", "//Alice");
const Bob = devAccount("Bob", "//Bob");
const Charlie = devAccount("Charlie", "//Charlie");
const Dave = devAccount("Dave", "//Dave");

console.log("Accounts:");
console.log(`  Alice   ${Alice.h160}`);
console.log(`  Bob     ${Bob.h160}`);
console.log(`  Charlie ${Charlie.h160}`);
console.log(`  Dave    ${Dave.h160}`);
console.log();

const cdm = createCdmFromFile({
    targetHash: selectTargetHash(),
    defaultSigner: Alice.signer,
    defaultOrigin: Alice.ss58,
});

const contexts = cdm.getContract("@polkadot/contexts") as any;

// Pre-flight: confirm the deployed contracts contract responds. Without this,
// a wiped chain (e.g. chopsticks restart) leaves the cdm.json address pointing
// at empty storage — every `expectRevert` would then silently pass (any error
// counts as a revert), masking the real problem behind a misleading PASS count.
{
    const probeCtx = `0x${Buffer.from(randomBytes(32)).toString("hex")}` as `0x${string}`;
    const r = await contexts.registerContext.tx(probeCtx, Alice.h160, Alice.h160);
    if (!r.ok) {
        const addr = cdm.getAddress("@polkadot/contexts");
        console.error(
            `\nPre-flight failed: register_context tx reverted at ${addr}.\n` +
            `The contracts contract likely isn't deployed at the address in cdm.json.\n` +
            `If chopsticks was restarted, re-run:\n` +
            `  bun run setup:local\n` +
            `  bun run deploy:contexts\n`,
        );
        cdm.destroy();
        process.exit(2);
    }
}

// Fresh context_id per run so we always start from clean storage.
const ctx = `0x${Buffer.from(randomBytes(32)).toString("hex")}` as `0x${string}`;
console.log(`Context id: ${ctx}\n`);

try {
    console.log("register_context(ctx, Alice as owner, Bob as operator)");
    await expectOk("Alice can register", () =>
        contexts.registerContext.tx(ctx, Alice.h160, Bob.h160),
    );

    console.log("\nread checks");
    {
        const r = await contexts.isAuthorized.query(ctx, Alice.h160);
        check("isAuthorized(Alice) — owner path", r.success && r.value === true);
    }
    {
        const r = await contexts.isAuthorized.query(ctx, Bob.h160);
        check("isAuthorized(Bob) — operator path", r.success && r.value === true);
    }
    {
        const r = await contexts.isAuthorized.query(ctx, Charlie.h160);
        check("isAuthorized(Charlie) — neither", r.success && r.value === false);
    }
    {
        // is_owner is a back-compat alias for is_authorized — same semantics.
        const r = await contexts.isOwner.query(ctx, Bob.h160);
        check("isOwner(Bob) — alias delegates to isAuthorized", r.success && r.value === true);
    }
    {
        const r = await contexts.getOwner.query(ctx);
        check(
            "getOwner == Alice",
            r.success && (r.value as string).toLowerCase() === Alice.h160.toLowerCase(),
            `got ${r.value}`,
        );
    }

    console.log("\nadd_operators");
    await expectRevert("Charlie (non-owner) cannot addOperators", () =>
        contexts.addOperators.tx(ctx, [Charlie.h160], { signer: Charlie.signer, origin: Charlie.ss58 }),
    );
    await expectOk("Alice (owner) can addOperators([Charlie])", () =>
        contexts.addOperators.tx(ctx, [Charlie.h160]),
    );
    {
        const r = await contexts.isAuthorized.query(ctx, Charlie.h160);
        check("Charlie is now authorized", r.success && r.value === true);
    }

    console.log("\nremove_operators");
    await expectRevert("Charlie cannot removeOperators", () =>
        contexts.removeOperators.tx(ctx, [Bob.h160], { signer: Charlie.signer, origin: Charlie.ss58 }),
    );
    await expectOk("Alice can removeOperators([Bob])", () =>
        contexts.removeOperators.tx(ctx, [Bob.h160]),
    );
    {
        const r = await contexts.isAuthorized.query(ctx, Bob.h160);
        check("Bob no longer authorized", r.success && r.value === false);
    }

    console.log("\ntransfer_owner");
    await expectRevert("Charlie cannot transferOwner", () =>
        contexts.transferOwner.tx(ctx, Dave.h160, { signer: Charlie.signer, origin: Charlie.ss58 }),
    );
    await expectOk("Alice can transferOwner(Dave)", () =>
        contexts.transferOwner.tx(ctx, Dave.h160),
    );
    {
        const r = await contexts.getOwner.query(ctx);
        check(
            "getOwner == Dave after transfer",
            r.success && (r.value as string).toLowerCase() === Dave.h160.toLowerCase(),
        );
    }
    {
        const r = await contexts.isAuthorized.query(ctx, Alice.h160);
        check("Alice no longer authorized (lost ownership, never was operator)", r.success && r.value === false);
    }
    await expectRevert("Alice (former owner) cannot transferOwner again", () =>
        contexts.transferOwner.tx(ctx, Alice.h160),
    );

    const freshCtx = () =>
        `0x${Buffer.from(randomBytes(32)).toString("hex")}` as `0x${string}`;
    const eq = (a: unknown, b: string) =>
        typeof a === "string" && a.toLowerCase() === b.toLowerCase();
    const ZERO = "0x0000000000000000000000000000000000000000";

    console.log("\nregister_context idempotency");
    {
        const c = freshCtx();
        await expectOk("first register", () =>
            contexts.registerContext.tx(c, Alice.h160, Bob.h160),
        );
        // Second register with different params must be a silent no-op
        await expectOk("second register is a no-op (does not revert)", () =>
            contexts.registerContext.tx(c, Charlie.h160, Dave.h160),
        );
        const o = await contexts.getOwner.query(c);
        check("owner unchanged after second register", o.success && eq(o.value, Alice.h160), `got ${o.value}`);
        const b = await contexts.isAuthorized.query(c, Bob.h160);
        check("original operator still authorized", b.success && b.value === true);
        const d = await contexts.isAuthorized.query(c, Dave.h160);
        check("second-register operator NOT added", d.success && d.value === false);
    }

    console.log("\nidempotent add_operators");
    {
        const c = freshCtx();
        await contexts.registerContext.tx(c, Alice.h160, Bob.h160);
        await expectOk("re-adding existing operator does not revert", () =>
            contexts.addOperators.tx(c, [Bob.h160]),
        );
        const r = await contexts.isAuthorized.query(c, Bob.h160);
        check("Bob still authorized (no state corruption)", r.success && r.value === true);
    }

    console.log("\nremove_operators on non-operator is a no-op");
    {
        const c = freshCtx();
        await contexts.registerContext.tx(c, Alice.h160, Bob.h160);
        // Charlie was never added
        await expectOk("removing non-operator does not revert", () =>
            contexts.removeOperators.tx(c, [Charlie.h160]),
        );
        const ch = await contexts.isAuthorized.query(c, Charlie.h160);
        check("non-operator still not authorized after no-op remove", ch.success && ch.value === false);
        const b = await contexts.isAuthorized.query(c, Bob.h160);
        check("real operator unaffected", b.success && b.value === true);
    }

    console.log("\nowner-OR-operator fallback");
    {
        const c = freshCtx();
        // Register Alice as both owner AND initial operator
        await contexts.registerContext.tx(c, Alice.h160, Alice.h160);
        // Remove her from the operator set
        await expectOk("remove Alice from operator set", () =>
            contexts.removeOperators.tx(c, [Alice.h160]),
        );
        const r = await contexts.isAuthorized.query(c, Alice.h160);
        check("Alice still authorized via owner path after operator removal", r.success && r.value === true);
    }

    console.log("\nbatch add/remove operators");
    {
        const c = freshCtx();
        await contexts.registerContext.tx(c, Alice.h160, Bob.h160);
        await expectOk("addOperators batches multiple addresses", () =>
            contexts.addOperators.tx(c, [Charlie.h160, Dave.h160]),
        );
        const ch = await contexts.isAuthorized.query(c, Charlie.h160);
        const d = await contexts.isAuthorized.query(c, Dave.h160);
        check("Charlie added via batch", ch.success && ch.value === true);
        check("Dave added via batch", d.success && d.value === true);
        await expectOk("removeOperators batches multiple addresses", () =>
            contexts.removeOperators.tx(c, [Charlie.h160, Dave.h160]),
        );
        const ch2 = await contexts.isAuthorized.query(c, Charlie.h160);
        const d2 = await contexts.isAuthorized.query(c, Dave.h160);
        check("Charlie removed via batch", ch2.success && ch2.value === false);
        check("Dave removed via batch", d2.success && d2.value === false);
    }

    console.log("\ntransfer_owner preserves operator set");
    {
        const c = freshCtx();
        await contexts.registerContext.tx(c, Alice.h160, Bob.h160);
        await contexts.addOperators.tx(c, [Charlie.h160]);
        await contexts.transferOwner.tx(c, Dave.h160);
        const b = await contexts.isAuthorized.query(c, Bob.h160);
        check("Bob still authorized after owner transfer", b.success && b.value === true);
        const ch = await contexts.isAuthorized.query(c, Charlie.h160);
        check("Charlie still authorized after owner transfer", ch.success && ch.value === true);
        const d = await contexts.isAuthorized.query(c, Dave.h160);
        check("new owner Dave authorized", d.success && d.value === true);
    }

    console.log("\nmulti-context isolation");
    {
        const cA = freshCtx();
        const cB = freshCtx();
        await contexts.registerContext.tx(cA, Alice.h160, Bob.h160);
        await contexts.registerContext.tx(cB, Charlie.h160, Dave.h160);

        const ownerA = await contexts.getOwner.query(cA);
        const ownerB = await contexts.getOwner.query(cB);
        check("ctxA owner is Alice", ownerA.success && eq(ownerA.value, Alice.h160));
        check("ctxB owner is Charlie", ownerB.success && eq(ownerB.value, Charlie.h160));

        const bobInA = await contexts.isAuthorized.query(cA, Bob.h160);
        const bobInB = await contexts.isAuthorized.query(cB, Bob.h160);
        check("Bob authorized only in ctxA", bobInA.success && bobInA.value === true && bobInB.success && bobInB.value === false);

        const daveInA = await contexts.isAuthorized.query(cA, Dave.h160);
        const daveInB = await contexts.isAuthorized.query(cB, Dave.h160);
        check("Dave authorized only in ctxB", daveInB.success && daveInB.value === true && daveInA.success && daveInA.value === false);
    }

    console.log("\nunregistered context");
    {
        const c = freshCtx();
        const o = await contexts.getOwner.query(c);
        check("getOwner returns zero address", o.success && eq(o.value, ZERO), `got ${o.value}`);
        const a = await contexts.isAuthorized.query(c, Alice.h160);
        check("isAuthorized returns false for unregistered context", a.success && a.value === false);
    }
} finally {
    cdm.destroy();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
