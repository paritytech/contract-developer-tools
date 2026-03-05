import { default as bulletin, type BulletinWhitelistEntry } from "./bulletin";
export { bulletin };
export type * from "./bulletin";
import { default as assethub, type AssethubWhitelistEntry } from "./assethub";
export { assethub };
export type * from "./assethub";
export { DigestItem, Phase, DispatchClass, TokenError, ArithmeticError, TransactionalError, OffencesEvent, GrandpaEvent, BabeDigestsNextConfigDescriptor, BabeAllowedSlots, BabeDigestsPreDigest, GrandpaStoredState, GrandpaEquivocation, MultiAddress, TransactionValidityUnknownTransaction, TransactionValidityTransactionSource, PreimageEvent, BalanceStatus, PreimagePalletHoldReason, TransactionPaymentEvent, XcmV5Junctions, XcmV5Junction, XcmV5NetworkId, XcmV3JunctionBodyId, XcmV2JunctionBodyPart, XcmV5Instruction, XcmV3MultiassetFungibility, XcmV3MultiassetAssetInstance, XcmV3MaybeErrorCode, XcmV2OriginKind, XcmV5AssetFilter, XcmV5WildAsset, XcmV2MultiassetWildFungibility, XcmV3WeightLimit, XcmVersionedAssets, XcmV3MultiassetAssetId, XcmV3Junctions, XcmV3Junction, XcmV3JunctionNetworkId, XcmVersionedLocation, StakingRewardDestination, StakingForcing, NominationPoolsPoolState, NominationPoolsCommissionClaimPermission, NominationPoolsClaimPermission, BagsListEvent, ConvictionVotingVoteAccountVote, PreimagesBounded, UpgradeGoAhead, UpgradeRestriction, PreimageOldRequestStatus, PreimageRequestStatus, BalancesTypesReasons, NominationPoolsPalletFreezeReason, TransactionPaymentReleases, Version, XcmV3Response, XcmV3TraitsError, XcmV4Response, XcmPalletVersionMigrationStage, XcmVersionedAssetId, ConvictionVotingVoteVoting, VotingConviction, TraitsScheduleDispatchTime, TreasuryPaymentState, ReferendaTypesCurve, BalancesAdjustmentDirection, XcmVersionedXcm, XcmV3Instruction, XcmV3MultiassetMultiAssetFilter, XcmV3MultiassetWildMultiAsset, XcmV4Instruction, XcmV4AssetAssetFilter, XcmV4AssetWildAsset, StakingPalletConfigOpBig, StakingPalletConfigOp, NominationPoolsBondExtra, NominationPoolsConfigOp, XcmVersionedAsset } from './common-types';
export declare const getMetadata: (codeHash: string) => Promise<Uint8Array | null>;
export type WhitelistEntry = BulletinWhitelistEntry | AssethubWhitelistEntry;
export type WhitelistEntriesByChain = Partial<{
    "*": WhitelistEntry[];
    bulletin: WhitelistEntry[];
    assethub: WhitelistEntry[];
}>;
export * as contracts from './contracts';
