#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTRACTS_REGISTRY_ABI, MetadataPublisher, STORAGE_DEPOSIT_LIMIT } from "@parity/cdm-builder";
import { createCdmChainClient, getChainPreset, prepareSignerFromSuri, ss58Address } from "@parity/cdm-env";
import { BulletinPreparer, DEFAULT_CLIENT_CONFIG } from "@parity/product-sdk-cloud-storage";
import { createContractFromClient } from "@parity/product-sdk-contracts";
import { batchSubmitAndWatch } from "@parity/product-sdk-tx";

const args = process.argv.slice(2);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultManifest = resolve(scriptDir, "dotns-assets/metadata.json");
const usage = "Usage: bun scripts/register-dotns.ts --suri <suri> [--dry-run] [--name paseo] [--batch-size 4] [--gas-buffer-percent 100]";
if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

const opt = (flags: string[], fallback?: string) => {
  for (const flag of flags) {
    const i = args.indexOf(flag);
    if (i !== -1) return args[i + 1];
  }
  return fallback;
};
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const readAbi = (path: string) => {
  const value = readJson(path);
  const abi = Array.isArray(value) ? value : value.abi;
  if (!abi?.length) throw new Error(`Empty ABI: ${path}`);
  return abi;
};
const bulletinPreparer = new BulletinPreparer();
const computeBulletinCid = async (data: Uint8Array) => {
  if (data.length > DEFAULT_CLIENT_CONFIG.chunkingThreshold) {
    const prepared = await bulletinPreparer.prepareStoreChunked(data);
    const cid = prepared.manifest?.cid;
    if (!cid) throw new Error("Bulletin CID precompute did not produce a manifest CID");
    return cid.toString();
  }
  const { cid } = await bulletinPreparer.prepareStore(data);
  return cid.toString();
};
const formatWeight = (w: { ref_time: bigint; proof_size: bigint }) => `${w.ref_time}/${w.proof_size}`;
const bufferWeight = (w: { ref_time: bigint; proof_size: bigint }, percent: number) => {
  const scale = BigInt(100 + percent);
  return {
    ref_time: (w.ref_time * scale + 99n) / 100n,
    proof_size: (w.proof_size * scale + 99n) / 100n,
  };
};

const name = opt(["--name", "-n"], "paseo")!;
const suri = opt(["--suri"]);
const dryRun = args.includes("--dry-run");
const batchSize = Number(opt(["--batch-size"], "4"));
const gasBufferPercent = Number(opt(["--gas-buffer-percent"], "100"));
const manifestPath = resolve(opt(["--metadata"], defaultManifest)!);
const manifest = readJson(manifestPath);
if (manifest.version !== 1 || !manifest.contracts?.length) throw new Error(`Invalid DotNS manifest: ${manifestPath}`);
if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("--batch-size must be a positive integer");
if (!Number.isInteger(gasBufferPercent) || gasBufferPercent < 0) throw new Error("--gas-buffer-percent must be a non-negative integer");

const manifestDir = dirname(manifestPath);
const publishedAt = new Date().toISOString();
const contracts = (manifest.contracts as any[]).map((contract) => {
  if (!/^@[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(contract.cdmPackage)) {
    throw new Error(`Invalid CDM package: ${contract.cdmPackage}`);
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(contract.address)) {
    throw new Error(`Invalid address for ${contract.cdmPackage}: ${contract.address}`);
  }

  const abi = readAbi(resolve(manifestDir, contract.abiPath));
  const metadata = {
    publish_block: 0,
    published_at: publishedAt,
    description: contract.description ?? "",
    readme: readFileSync(resolve(manifestDir, contract.readmePath), "utf8"),
    authors: contract.authors ?? manifest.authors ?? [],
    homepage: contract.homepage ?? manifest.homepage ?? "",
    repository: contract.repository ?? manifest.repository ?? "",
    abi,
  };
  return { ...contract, metadata };
});

const preset = name === "custom" ? undefined : getChainPreset(name);
const assethubUrl = opt(["--assethub-url"], preset?.assethubUrl);
const bulletinUrl = opt(["--bulletin-url"], preset?.bulletinUrl);
const registryAddress = opt(["--registry-address"], manifest.registry ?? preset?.registryAddress);
if (!assethubUrl || !bulletinUrl || !registryAddress) {
  throw new Error("Missing endpoints. Use --name paseo or pass --assethub-url, --bulletin-url, and --registry-address.");
}

console.log(`DotNS manifest  ${manifestPath}`);
console.log(`Asset Hub       ${assethubUrl}`);
console.log(`Bulletin        ${bulletinUrl}`);
console.log(`Registry        ${registryAddress}`);
console.log(`Contracts       ${contracts.length}`);
console.log(`Batch size      ${batchSize}`);
console.log(`Gas buffer      ${gasBufferPercent}%`);
if (dryRun) {
  contracts.forEach((contract) => console.log(`${contract.cdmPackage.padEnd(32)} ${contract.address}`));
  process.exit(0);
}
if (!suri) throw new Error(`--suri is required\n${usage}`);

const signer = prepareSignerFromSuri(suri);
const origin = ss58Address(signer.publicKey);
const client = await createCdmChainClient({ assethubUrl, bulletinUrl, chainName: name });

try {
  const registry = createContractFromClient(
    client.raw.assetHub,
    client.descriptors.assetHub,
    registryAddress,
    CONTRACTS_REGISTRY_ABI,
    { defaultSigner: signer, defaultOrigin: origin },
  ) as any;

  console.log(`Signer          ${origin}`);
  console.log("Precomputing Bulletin CIDs...");
  const metadataBytes = contracts.map((contract) => new TextEncoder().encode(JSON.stringify(contract.metadata)));
  const cids = await Promise.all(metadataBytes.map(computeBulletinCid));
  contracts.forEach((contract, i) => console.log(`${contract.cdmPackage.padEnd(32)} ${cids[i]}`));

  console.log("Preparing registry calls...");
  const calls = [];
  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];
    const query = await registry.publishLatest.query(contract.cdmPackage, contract.address, cids[i], { origin });
    if (!query.success || !query.gasRequired) {
      throw new Error(`Registry dry-run failed for ${contract.cdmPackage}: ${String(query.value)}`);
    }
    const gasLimit = bufferWeight(query.gasRequired, gasBufferPercent);
    console.log(`${contract.cdmPackage.padEnd(32)} gas=${formatWeight(query.gasRequired)} buffered=${formatWeight(gasLimit)}`);
    calls.push(
      await registry.publishLatest.prepare(contract.cdmPackage, contract.address, cids[i], {
        origin,
        gasLimit,
        storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
      }),
    );
  }

  const publish = new MetadataPublisher(signer, client.bulletin, client.raw.bulletin)
    .publishBatch(contracts.map((contract) => contract.metadata))
    .then((result) => {
      result.cids.forEach((cid, i) => {
        if (cid !== cids[i]) throw new Error(`CID mismatch for ${contracts[i].cdmPackage}: expected ${cids[i]}, got ${cid}`);
      });
      console.log("Published metadata to Bulletin.");
      return result;
    });
  const register = (async () => {
    console.log("Registering addresses in CDM registry...");
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      const names = contracts.slice(i, i + batchSize).map((contract) => contract.cdmPackage).join(", ");
      console.log(`Submitting batch ${i / batchSize + 1}/${Math.ceil(calls.length / batchSize)}: ${names}`);
      const result = await batchSubmitAndWatch(batch, client.assetHub as any, signer, {
        mode: "batch_all",
        waitFor: "best-block",
      });
      console.log(`Registered batch ${i / batchSize + 1}/${Math.ceil(calls.length / batchSize)} ${result.txHash}`);
    }
  })();

  await Promise.all([publish, register]);
} finally {
  client.destroy();
}
