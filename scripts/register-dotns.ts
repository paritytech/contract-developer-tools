#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTRACTS_REGISTRY_ABI,
  GAS_LIMIT,
  MetadataPublisher,
  STORAGE_DEPOSIT_LIMIT,
} from "@parity/cdm-builder";
import { createCdmChainClient, getChainPreset, prepareSignerFromSuri, ss58Address } from "@parity/cdm-env";
import { createContractFromClient } from "@parity/product-sdk-contracts";
import { batchSubmitAndWatch } from "@parity/product-sdk-tx";

const args = process.argv.slice(2);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultManifest = resolve(scriptDir, "dotns-assets/metadata.json");
const usage = "Usage: bun scripts/register-dotns.ts --suri <suri> [--dry-run] [--name paseo]";
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

const name = opt(["--name", "-n"], "paseo")!;
const suri = opt(["--suri"]);
const dryRun = args.includes("--dry-run");
const manifestPath = resolve(opt(["--metadata"], defaultManifest)!);
const manifest = readJson(manifestPath);
if (manifest.version !== 1 || !manifest.contracts?.length) throw new Error(`Invalid DotNS manifest: ${manifestPath}`);

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
  console.log("Publishing metadata to Bulletin...");
  const { cids } = await new MetadataPublisher(signer, client.bulletin, client.raw.bulletin).publishBatch(
    contracts.map((contract) => contract.metadata),
  );

  console.log("Registering addresses in CDM registry...");
  const calls = await Promise.all(
    contracts.map((contract, i) =>
      registry.publishLatest.prepare(contract.cdmPackage, contract.address, cids[i], {
        origin,
        gasLimit: { ref_time: GAS_LIMIT.refTime, proof_size: GAS_LIMIT.proofSize },
        storageDepositLimit: STORAGE_DEPOSIT_LIMIT,
      }),
    ),
  );
  const result = await batchSubmitAndWatch(calls, client.assetHub as any, signer, {
    mode: "batch_all",
    waitFor: "best-block",
  });

  contracts.forEach((contract, i) => console.log(`${contract.cdmPackage.padEnd(32)} ${cids[i]}`));
  console.log(`Registered in ${result.txHash}`);
} finally {
  client.destroy();
}
