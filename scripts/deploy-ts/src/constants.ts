import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export const NODE_URL = process.env.NODE_URL || "ws://127.0.0.1:10020";

export const SURI = process.env.SURI || "//Alice";

export const SKIP_REBUILD = process.env.SKIP_REBUILD === "true";

// The contracts registry is the bootstrap - it's deployed first and has no CDM macro
export const CONTRACTS_REGISTRY_CRATE = "contracts";

// Generous defaults - work for most contracts, unused gas is refunded
export const GAS_LIMIT = { refTime: 500_000_000_000n, proofSize: 2_000_000n };

export const STORAGE_DEPOSIT_LIMIT = 10_000_000_000_000n;
