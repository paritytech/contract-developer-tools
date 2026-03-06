import {
  __export
} from "./chunk-7P6ASYW6.mjs";

// .papi/descriptors/src/common.ts
var table = new Uint8Array(128);
for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
var toBinary = (base64) => {
  const n = base64.length, bytes = new Uint8Array((n - Number(base64[n - 1] === "=") - Number(base64[n - 2] === "=")) * 3 / 4 | 0);
  for (let i2 = 0, j = 0; i2 < n; ) {
    const c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
    const c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
    bytes[j++] = c0 << 2 | c1 >> 4;
    bytes[j++] = c1 << 4 | c2 >> 2;
    bytes[j++] = c2 << 6 | c3;
  }
  return bytes;
};

// .papi/descriptors/src/bulletin.ts
var descriptorValues = import("./descriptors-3VTDZFVS.mjs").then((module) => module["Bulletin"]);
var metadataTypes = import("./metadataTypes-THEUVMS4.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var asset = {};
var extensions = {};
var getMetadata = () => import("./bulletin_metadata-CEMIHSIC.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var genesis = void 0;
var _allDescriptors = { descriptors: descriptorValues, metadataTypes, asset, extensions, getMetadata, genesis };
var bulletin_default = _allDescriptors;

// .papi/descriptors/src/assethub.ts
var descriptorValues2 = import("./descriptors-3VTDZFVS.mjs").then((module) => module["Assethub"]);
var metadataTypes2 = import("./metadataTypes-THEUVMS4.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var asset2 = {};
var extensions2 = {};
var getMetadata2 = () => import("./assethub_metadata-6ORERZTC.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var genesis2 = void 0;
var _allDescriptors2 = { descriptors: descriptorValues2, metadataTypes: metadataTypes2, asset: asset2, extensions: extensions2, getMetadata: getMetadata2, genesis: genesis2 };
var assethub_default = _allDescriptors2;

// .papi/descriptors/src/common-types.ts
import { _Enum } from "polkadot-api";
var DigestItem = _Enum;
var Phase = _Enum;
var DispatchClass = _Enum;
var TokenError = _Enum;
var ArithmeticError = _Enum;
var TransactionalError = _Enum;
var OffencesEvent = _Enum;
var GrandpaEvent = _Enum;
var BabeDigestsNextConfigDescriptor = _Enum;
var BabeAllowedSlots = _Enum;
var BabeDigestsPreDigest = _Enum;
var GrandpaStoredState = _Enum;
var GrandpaEquivocation = _Enum;
var MultiAddress = _Enum;
var TransactionValidityUnknownTransaction = _Enum;
var TransactionValidityTransactionSource = _Enum;
var PreimageEvent = _Enum;
var BalanceStatus = _Enum;
var PreimagePalletHoldReason = _Enum;
var TransactionPaymentEvent = _Enum;
var XcmV5Junctions = _Enum;
var XcmV5Junction = _Enum;
var XcmV5NetworkId = _Enum;
var XcmV3JunctionBodyId = _Enum;
var XcmV2JunctionBodyPart = _Enum;
var XcmV5Instruction = _Enum;
var XcmV3MultiassetFungibility = _Enum;
var XcmV3MultiassetAssetInstance = _Enum;
var XcmV3MaybeErrorCode = _Enum;
var XcmV2OriginKind = _Enum;
var XcmV5AssetFilter = _Enum;
var XcmV5WildAsset = _Enum;
var XcmV2MultiassetWildFungibility = _Enum;
var XcmV3WeightLimit = _Enum;
var XcmVersionedAssets = _Enum;
var XcmV3MultiassetAssetId = _Enum;
var XcmV3Junctions = _Enum;
var XcmV3Junction = _Enum;
var XcmV3JunctionNetworkId = _Enum;
var XcmVersionedLocation = _Enum;
var StakingRewardDestination = _Enum;
var StakingForcing = _Enum;
var NominationPoolsPoolState = _Enum;
var NominationPoolsCommissionClaimPermission = _Enum;
var NominationPoolsClaimPermission = _Enum;
var BagsListEvent = _Enum;
var ConvictionVotingVoteAccountVote = _Enum;
var PreimagesBounded = _Enum;
var UpgradeGoAhead = _Enum;
var UpgradeRestriction = _Enum;
var PreimageOldRequestStatus = _Enum;
var PreimageRequestStatus = _Enum;
var BalancesTypesReasons = _Enum;
var NominationPoolsPalletFreezeReason = _Enum;
var TransactionPaymentReleases = _Enum;
var Version = _Enum;
var XcmV3Response = _Enum;
var XcmV3TraitsError = _Enum;
var XcmV4Response = _Enum;
var XcmPalletVersionMigrationStage = _Enum;
var XcmVersionedAssetId = _Enum;
var ConvictionVotingVoteVoting = _Enum;
var VotingConviction = _Enum;
var TraitsScheduleDispatchTime = _Enum;
var TreasuryPaymentState = _Enum;
var ReferendaTypesCurve = _Enum;
var BalancesAdjustmentDirection = _Enum;
var XcmVersionedXcm = _Enum;
var XcmV3Instruction = _Enum;
var XcmV3MultiassetMultiAssetFilter = _Enum;
var XcmV3MultiassetWildMultiAsset = _Enum;
var XcmV4Instruction = _Enum;
var XcmV4AssetAssetFilter = _Enum;
var XcmV4AssetWildAsset = _Enum;
var StakingPalletConfigOpBig = _Enum;
var StakingPalletConfigOp = _Enum;
var NominationPoolsBondExtra = _Enum;
var NominationPoolsConfigOp = _Enum;
var XcmVersionedAsset = _Enum;

// .papi/descriptors/src/contracts/index.ts
var contracts_exports = {};
__export(contracts_exports, {
  contexts: () => descriptor3,
  contractsRegistry: () => descriptor2,
  disputes: () => descriptor
});

// .papi/descriptors/src/contracts/disputes.ts
var descriptor = { abi: [{ "type": "constructor", "inputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "addInstruction", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "metadata_uri", "type": "string" }, { "name": "voting_rule_id", "type": "uint8" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "getInstructionCount", "inputs": [{ "name": "context_id", "type": "bytes32" }], "outputs": [{ "name": "", "type": "uint32" }], "stateMutability": "view" }, { "type": "function", "name": "getInstruction", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "index", "type": "uint32" }], "outputs": [{ "name": "", "type": "tuple", "components": [{ "name": "metadata_uri", "type": "string" }, { "name": "voting_rule_id", "type": "uint8" }] }], "stateMutability": "view" }, { "type": "function", "name": "openDispute", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }, { "name": "claimant", "type": "address" }, { "name": "against", "type": "bytes32" }, { "name": "claim_uri", "type": "string" }, { "name": "instruction_index", "type": "uint32" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "submitCounterEvidence", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }, { "name": "counter_claim_uri", "type": "string" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "beginVoting", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "provideJudgment", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }, { "name": "decision", "type": "uint8" }, { "name": "resolution_uri", "type": "string" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "castVote", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }, { "name": "value", "type": "uint8" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "getDisputeStatus", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }], "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view" }, { "type": "function", "name": "getDecision", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }], "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view" }, { "type": "function", "name": "getVoteCount", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }], "outputs": [{ "name": "", "type": "uint32" }], "stateMutability": "view" }, { "type": "function", "name": "getDisputeInfo", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }], "outputs": [{ "name": "", "type": "tuple", "components": [{ "name": "status", "type": "uint8" }, { "name": "vote_count", "type": "uint32" }, { "name": "claimant", "type": "address" }, { "name": "against", "type": "bytes32" }, { "name": "instruction_index", "type": "uint32" }, { "name": "claim_uri", "type": "string" }, { "name": "counter_claim_uri", "type": "string" }, { "name": "resolution_uri", "type": "string" }] }], "stateMutability": "view" }, { "type": "function", "name": "getTotalDisputeCount", "inputs": [], "outputs": [{ "name": "", "type": "uint32" }], "stateMutability": "view" }, { "type": "function", "name": "getDisputeAt", "inputs": [{ "name": "index", "type": "uint32" }], "outputs": [{ "name": "", "type": "tuple", "components": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }] }], "stateMutability": "view" }, { "type": "function", "name": "deleteDispute", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "dispute_id", "type": "bytes32" }], "outputs": [], "stateMutability": "nonpayable" }] };

// .papi/descriptors/src/contracts/contractsRegistry.ts
var descriptor2 = { abi: [{ "type": "function", "name": "getAddress", "inputs": [{ "name": "contract_name", "type": "string" }], "outputs": [{ "name": "", "type": "tuple", "components": [{ "name": "isSome", "type": "bool" }, { "name": "value", "type": "address" }] }], "stateMutability": "view" }, { "type": "function", "name": "getAddressAtVersion", "inputs": [{ "name": "contract_name", "type": "string" }, { "name": "version", "type": "uint32" }], "outputs": [{ "name": "", "type": "tuple", "components": [{ "name": "isSome", "type": "bool" }, { "name": "value", "type": "address" }] }], "stateMutability": "view" }, { "type": "function", "name": "getVersionCount", "inputs": [{ "name": "contract_name", "type": "string" }], "outputs": [{ "name": "", "type": "uint32" }], "stateMutability": "view" }, { "type": "function", "name": "getContractCount", "inputs": [], "outputs": [{ "name": "", "type": "uint32" }], "stateMutability": "view" }] };

// .papi/descriptors/src/contracts/contexts.ts
var descriptor3 = { abi: [{ "type": "constructor", "inputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "registerContext", "inputs": [{ "name": "context_id", "type": "bytes32" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "getOwner", "inputs": [{ "name": "context_id", "type": "bytes32" }], "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view" }, { "type": "function", "name": "isOwner", "inputs": [{ "name": "context_id", "type": "bytes32" }, { "name": "address", "type": "address" }], "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "view" }] };

// .papi/descriptors/src/index.ts
var metadatas = {};
var getMetadata3 = async (codeHash) => {
  try {
    return await metadatas[codeHash].getMetadata();
  } catch {
  }
  return null;
};
export {
  ArithmeticError,
  BabeAllowedSlots,
  BabeDigestsNextConfigDescriptor,
  BabeDigestsPreDigest,
  BagsListEvent,
  BalanceStatus,
  BalancesAdjustmentDirection,
  BalancesTypesReasons,
  ConvictionVotingVoteAccountVote,
  ConvictionVotingVoteVoting,
  DigestItem,
  DispatchClass,
  GrandpaEquivocation,
  GrandpaEvent,
  GrandpaStoredState,
  MultiAddress,
  NominationPoolsBondExtra,
  NominationPoolsClaimPermission,
  NominationPoolsCommissionClaimPermission,
  NominationPoolsConfigOp,
  NominationPoolsPalletFreezeReason,
  NominationPoolsPoolState,
  OffencesEvent,
  Phase,
  PreimageEvent,
  PreimageOldRequestStatus,
  PreimagePalletHoldReason,
  PreimageRequestStatus,
  PreimagesBounded,
  ReferendaTypesCurve,
  StakingForcing,
  StakingPalletConfigOp,
  StakingPalletConfigOpBig,
  StakingRewardDestination,
  TokenError,
  TraitsScheduleDispatchTime,
  TransactionPaymentEvent,
  TransactionPaymentReleases,
  TransactionValidityTransactionSource,
  TransactionValidityUnknownTransaction,
  TransactionalError,
  TreasuryPaymentState,
  UpgradeGoAhead,
  UpgradeRestriction,
  Version,
  VotingConviction,
  XcmPalletVersionMigrationStage,
  XcmV2JunctionBodyPart,
  XcmV2MultiassetWildFungibility,
  XcmV2OriginKind,
  XcmV3Instruction,
  XcmV3Junction,
  XcmV3JunctionBodyId,
  XcmV3JunctionNetworkId,
  XcmV3Junctions,
  XcmV3MaybeErrorCode,
  XcmV3MultiassetAssetId,
  XcmV3MultiassetAssetInstance,
  XcmV3MultiassetFungibility,
  XcmV3MultiassetMultiAssetFilter,
  XcmV3MultiassetWildMultiAsset,
  XcmV3Response,
  XcmV3TraitsError,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV4Instruction,
  XcmV4Response,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junction,
  XcmV5Junctions,
  XcmV5NetworkId,
  XcmV5WildAsset,
  XcmVersionedAsset,
  XcmVersionedAssetId,
  XcmVersionedAssets,
  XcmVersionedLocation,
  XcmVersionedXcm,
  assethub_default as assethub,
  bulletin_default as bulletin,
  contracts_exports as contracts,
  getMetadata3 as getMetadata
};
