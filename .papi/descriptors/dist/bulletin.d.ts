import { StorageDescriptor, PlainDescriptor, TxDescriptor, RuntimeDescriptor, Enum, ApisFromDef, QueryFromPalletsDef, TxFromPalletsDef, EventsFromPalletsDef, ErrorsFromPalletsDef, ConstFromPalletsDef, ViewFnsFromPalletsDef, SS58String, FixedSizeBinary, Binary, FixedSizeArray } from "polkadot-api";
import { I717ld1j90eil, Iffmde3ekjedi9, I4mddgoa69c0a2, I702lrlakojide, I95g6i7ilua7lq, Ieniouoqkq4icf, Phase, Ibgl04rn6nbfm6, I4q39t5hn830vp, I3geksg000c171, BabeDigestsNextConfigDescriptor, Ic5m5lp1oioo8r, Idq7or56ds2f13, I4s6vifaf8k998, I9jd27rnpm8ttv, I8jnd4d8ip6djo, Ifip05kcrl65am, I597fhdv720j3r, I23nq3fsgtejt, I4pact7n2e9a0i, Ia2lhg7l2hilo3, I4nod9ik6g6r96, I1ls87tb328id3, I82jm9g7pufuel, GrandpaStoredState, I7pe2me3i3vtn9, I52552vmt51a1m, Icd998p53cb80u, Ianratlvp36bb8, Idftgde1j2kabb, I4p5t2krb1gmvp, I67smi4kj2jg4u, I74nture9pgqeq, Ibqjcgmcid3dll, Id15d558jgoqcl, Icdpdqb1rbmstf, I1rnotsmqcgi9a, I84l6vdi7riqfe, Iktdie89uk6pa, I775lbh1002e7f, I9p9lq3rej5bhc, In7a38730s6qs, If15el53dd76v9, I9s0ave7t0vnrk, I4fo08joqmcqnm, I4arjljr6dpflb, I8ofcg5rbj0g2c, I4adgbll7gku4i, I6pjjpfvhvcfru, I9pj91mj79qekl, I39uah9nss64h9, Ik64dknsq7k08, Ib51vk42m1po4n, I50ppnqasq4tjq, I9fin09kkg0jaj, Idcr6u6361oad9, I4cbvqmqadhrea, I3aiifqvqrbar5, I7ne83r38c2sqq, I2hviml3snvhhn, Itrlf5b2o2l8q, I4vj3ndsquheo1, I7h5kud22qmfsg, I2i8iea6e4ne1j, I4jotama61aldv, I3rfugj0vt1ug5, I29mlfpi57nes9, I9n8t62ile2km9, Iaqek632j1l53f, Id3fgg5dtq3ja9, I7hl2ljcti73p2, I19i0akqkvu7h8, I4pbpsirgl3tci, I1be5fgduvh91i, If7h5asiehgc1m, Imfmpjta062dn, I26u4i5eaerrg9, I5fef7i0ugnvt6, I9s640fgd7ljnm, I8k3rnvpeeh4hv, I7mprq7fgt4l8r, I5s6rsjmb12ktk, I3lj33btcqlb1i, I707m7edh0jft8, I2j5sqe1l974kn, I2eb501t8s6hsq, Ianmuoljk2sk1u, I6m5tiqkcapv48, Ia82mnkmeo2rhc, Isag1cdadd68s, Icbccs0ug47ilf, I855j4i3kr8ko1, Ifj3vvvojic2ac, Iempvdlhc5ih6g, I666bl2fqjkejo, I85icj2qbjeqbe, I2hq50pu2kdjpo, I9acqruh7322g2, I5768ac424h061, Ibrq4vd4dm959l, I66jdpl6lile9j, Id4cm1n8k2kug1, I6p1tq74832j8u, Ij76tvu0faddj, I6r44prunlrgaa, I6b8h9eitutv15, I34pucbefgbh7, I3hmd9tck40707, I4cj2rds2sto1k, I5rtkmhm2dng4u, Iao67k11hfu3mi, Icovh3ggbhth1s, I8a8c1n38ann55, I2ur0oeqg495j8, I7f2f3co93gefl, I1bhd210c3phjj, I8ih4atobnlo2v, Ic2a7mmhqckbbo, I8ac87iu4gllf7, I9l4i4j74aic6u, I6usvuval5ataj, I6qd67h5q1e80s, Icqldr8j4je7f4, Iaqet9jc3ihboe, Ic952bubvq4k7d, I2v50gu3s1aqk6, Iabpgqcjikia83, Icgljjb6j82uhn, I4gil44d08grh, I7u915mvkdsb08, Idumr6sfbu3l5m, If7uv525tdvv7a, Itom7fk49o0c9, I2an1fs2eiebjp, TransactionValidityTransactionSource, I9ask1o4tfvcvs, I4ph3d1eepnmr1, Icerf8h8pdu8ss, Iems84l8lk2v0c, I1r5ke30ueqo0r, I68ii5ik8avr9o, I9puqgoda8ofk4, I7gtb9g2qv4r10, Ievrs91su783vi, I3r3poh6h8vl7n, I74b5o27m5tpv, I7uf2ofmdnm812, Ie9sr1iqcg3cgm, I1mqgk2tmnn9i2, I6lr8sctk0bi4e, I6spmpef2c7svf, Iei2mvq0mjvt81, Ideol201iiphm6, If2t8tp4q6th5 } from "./common-types";
type AnonymousEnum<T extends {}> = T & {
    __anonymous: true;
};
type MyTuple<T> = [T, ...T[]];
type SeparateUndefined<T> = undefined extends T ? undefined | Exclude<T, undefined> : T;
type Anonymize<T> = SeparateUndefined<T extends FixedSizeBinary<infer L> ? number extends L ? Binary : FixedSizeBinary<L> : T extends string | number | bigint | boolean | void | undefined | null | symbol | Uint8Array | Enum<any> ? T : T extends AnonymousEnum<infer V> ? Enum<V> : T extends MyTuple<any> ? {
    [K in keyof T]: T[K];
} : T extends [] ? [] : T extends FixedSizeArray<infer L, infer T> ? number extends L ? Array<T> : FixedSizeArray<L, T> : {
    [K in keyof T & string]: T[K];
}>;
type IStorage = {
    System: {
        /**
         * The full account information for a particular account ID.
         */
        Account: StorageDescriptor<[Key: SS58String], Anonymize<I717ld1j90eil>, false, never>;
        /**
         * Total extrinsics count for the current block.
         */
        ExtrinsicCount: StorageDescriptor<[], number, true, never>;
        /**
         * Whether all inherents have been applied.
         */
        InherentsApplied: StorageDescriptor<[], boolean, false, never>;
        /**
         * The current weight for the block.
         */
        BlockWeight: StorageDescriptor<[], Anonymize<Iffmde3ekjedi9>, false, never>;
        /**
         * Total length (in bytes) for all extrinsics put together, for the current block.
         */
        AllExtrinsicsLen: StorageDescriptor<[], number, true, never>;
        /**
         * Map of block numbers to block hashes.
         */
        BlockHash: StorageDescriptor<[Key: number], FixedSizeBinary<32>, false, never>;
        /**
         * Extrinsics data for the current block (maps an extrinsic's index to its data).
         */
        ExtrinsicData: StorageDescriptor<[Key: number], Binary, false, never>;
        /**
         * The current block number being processed. Set by `execute_block`.
         */
        Number: StorageDescriptor<[], number, false, never>;
        /**
         * Hash of the previous block.
         */
        ParentHash: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
        /**
         * Digest of the current block, also part of the block header.
         */
        Digest: StorageDescriptor<[], Anonymize<I4mddgoa69c0a2>, false, never>;
        /**
         * Events deposited for the current block.
         *
         * NOTE: The item is unbound and should therefore never be read on chain.
         * It could otherwise inflate the PoV size of a block.
         *
         * Events have a large in-memory size. Box the events to not go out-of-memory
         * just in case someone still reads them from within the runtime.
         */
        Events: StorageDescriptor<[], Anonymize<I702lrlakojide>, false, never>;
        /**
         * The number of events in the `Events<T>` list.
         */
        EventCount: StorageDescriptor<[], number, false, never>;
        /**
         * Mapping between a topic (represented by T::Hash) and a vector of indexes
         * of events in the `<Events<T>>` list.
         *
         * All topic vectors have deterministic storage locations depending on the topic. This
         * allows light-clients to leverage the changes trie storage tracking mechanism and
         * in case of changes fetch the list of events of interest.
         *
         * The value has the type `(BlockNumberFor<T>, EventIndex)` because if we used only just
         * the `EventIndex` then in case if the topic has the same contents on the next block
         * no notification will be triggered thus the event might be lost.
         */
        EventTopics: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I95g6i7ilua7lq>, false, never>;
        /**
         * Stores the `spec_version` and `spec_name` of when the last runtime upgrade happened.
         */
        LastRuntimeUpgrade: StorageDescriptor<[], Anonymize<Ieniouoqkq4icf>, true, never>;
        /**
         * True if we have upgraded so that `type RefCount` is `u32`. False (default) if not.
         */
        UpgradedToU32RefCount: StorageDescriptor<[], boolean, false, never>;
        /**
         * True if we have upgraded so that AccountInfo contains three types of `RefCount`. False
         * (default) if not.
         */
        UpgradedToTripleRefCount: StorageDescriptor<[], boolean, false, never>;
        /**
         * The execution phase of the block.
         */
        ExecutionPhase: StorageDescriptor<[], Phase, true, never>;
        /**
         * `Some` if a code upgrade has been authorized.
         */
        AuthorizedUpgrade: StorageDescriptor<[], Anonymize<Ibgl04rn6nbfm6>, true, never>;
        /**
         * The weight reclaimed for the extrinsic.
         *
         * This information is available until the end of the extrinsic execution.
         * More precisely this information is removed in `note_applied_extrinsic`.
         *
         * Logic doing some post dispatch weight reduction must update this storage to avoid duplicate
         * reduction.
         */
        ExtrinsicWeightReclaimed: StorageDescriptor<[], Anonymize<I4q39t5hn830vp>, false, never>;
    };
    Babe: {
        /**
         * Current epoch index.
         */
        EpochIndex: StorageDescriptor<[], bigint, false, never>;
        /**
         * Current epoch authorities.
         */
        Authorities: StorageDescriptor<[], Anonymize<I3geksg000c171>, false, never>;
        /**
         * The slot at which the first epoch actually started. This is 0
         * until the first block of the chain.
         */
        GenesisSlot: StorageDescriptor<[], bigint, false, never>;
        /**
         * Current slot number.
         */
        CurrentSlot: StorageDescriptor<[], bigint, false, never>;
        /**
         * The epoch randomness for the *current* epoch.
         *
         * # Security
         *
         * This MUST NOT be used for gambling, as it can be influenced by a
         * malicious validator in the short term. It MAY be used in many
         * cryptographic protocols, however, so long as one remembers that this
         * (like everything else on-chain) it is public. For example, it can be
         * used where a number is needed that cannot have been chosen by an
         * adversary, for purposes such as public-coin zero-knowledge proofs.
         */
        Randomness: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
        /**
         * Pending epoch configuration change that will be applied when the next epoch is enacted.
         */
        PendingEpochConfigChange: StorageDescriptor<[], BabeDigestsNextConfigDescriptor, true, never>;
        /**
         * Next epoch randomness.
         */
        NextRandomness: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
        /**
         * Next epoch authorities.
         */
        NextAuthorities: StorageDescriptor<[], Anonymize<I3geksg000c171>, false, never>;
        /**
         * Randomness under construction.
         *
         * We make a trade-off between storage accesses and list length.
         * We store the under-construction randomness in segments of up to
         * `UNDER_CONSTRUCTION_SEGMENT_LENGTH`.
         *
         * Once a segment reaches this length, we begin the next one.
         * We reset all segments and return to `0` at the beginning of every
         * epoch.
         */
        SegmentIndex: StorageDescriptor<[], number, false, never>;
        /**
         * TWOX-NOTE: `SegmentIndex` is an increasing integer, so this is okay.
         */
        UnderConstruction: StorageDescriptor<[Key: number], Anonymize<Ic5m5lp1oioo8r>, false, never>;
        /**
         * Temporary value (cleared at block finalization) which is `Some`
         * if per-block initialization has already been called for current block.
         */
        Initialized: StorageDescriptor<[], Anonymize<Idq7or56ds2f13>, true, never>;
        /**
         * This field should always be populated during block processing unless
         * secondary plain slots are enabled (which don't contain a VRF output).
         *
         * It is set in `on_finalize`, before it will contain the value from the last block.
         */
        AuthorVrfRandomness: StorageDescriptor<[], Anonymize<I4s6vifaf8k998>, false, never>;
        /**
         * The block numbers when the last and current epoch have started, respectively `N-1` and
         * `N`.
         * NOTE: We track this is in order to annotate the block number when a given pool of
         * entropy was fixed (i.e. it was known to chain observers). Since epochs are defined in
         * slots, which may be skipped, the block numbers may not line up with the slot numbers.
         */
        EpochStart: StorageDescriptor<[], Anonymize<I9jd27rnpm8ttv>, false, never>;
        /**
         * How late the current block is compared to its parent.
         *
         * This entry is populated as part of block execution and is cleaned up
         * on block finalization. Querying this storage entry outside of block
         * execution context should always yield zero.
         */
        Lateness: StorageDescriptor<[], number, false, never>;
        /**
         * The configuration for the current epoch. Should never be `None` as it is initialized in
         * genesis.
         */
        EpochConfig: StorageDescriptor<[], Anonymize<I8jnd4d8ip6djo>, true, never>;
        /**
         * The configuration for the next epoch, `None` if the config will not change
         * (you can fallback to `EpochConfig` instead in that case).
         */
        NextEpochConfig: StorageDescriptor<[], Anonymize<I8jnd4d8ip6djo>, true, never>;
        /**
         * A list of the last 100 skipped epochs and the corresponding session index
         * when the epoch was skipped.
         *
         * This is only used for validating equivocation proofs. An equivocation proof
         * must contains a key-ownership proof for a given session, therefore we need a
         * way to tie together sessions and epoch indices, i.e. we need to validate that
         * a validator was the owner of a given key on a given session, and what the
         * active epoch index was during that session.
         */
        SkippedEpochs: StorageDescriptor<[], Anonymize<Ifip05kcrl65am>, false, never>;
    };
    Timestamp: {
        /**
         * The current time for the current block.
         */
        Now: StorageDescriptor<[], bigint, false, never>;
        /**
         * Whether the timestamp has been updated in this block.
         *
         * This value is updated to `true` upon successful submission of a timestamp by a node.
         * It is then checked at the end of each block execution in the `on_finalize` hook.
         */
        DidUpdate: StorageDescriptor<[], boolean, false, never>;
    };
    Authorship: {
        /**
         * Author of current block.
         */
        Author: StorageDescriptor<[], SS58String, true, never>;
    };
    Offences: {
        /**
         * The primary structure that holds all offence records keyed by report identifiers.
         */
        Reports: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I597fhdv720j3r>, true, never>;
        /**
         * A vector of reports of the same kind that happened at the same time slot.
         */
        ConcurrentReportsIndex: StorageDescriptor<Anonymize<I23nq3fsgtejt>, Anonymize<Ic5m5lp1oioo8r>, false, never>;
    };
    Historical: {
        /**
         * Mapping from historical session indices to session-data root hash and validator count.
         */
        HistoricalSessions: StorageDescriptor<[Key: number], Anonymize<I4pact7n2e9a0i>, true, never>;
        /**
         * The range of historical sessions we store. [first, last)
         */
        StoredRange: StorageDescriptor<[], Anonymize<I9jd27rnpm8ttv>, true, never>;
    };
    ValidatorSet: {
        /**
         * Validator set. Changes to this will take effect in the session after next.
         */
        Validators: StorageDescriptor<[Key: SS58String], number, true, never>;
        /**
         * Number of validators in `Validators`.
         */
        NumValidators: StorageDescriptor<[], number, false, never>;
        /**
         * Validators that should be disabled in the next session.
         *
         * Validator removal takes effect in the session after next. Validator disabling takes effect
         * until the end of the session. We extend disables to cover the next session as well (by
         * adding validators here when we disable them) so that when a validator is both disabled and
         * removed in response to an offence, there isn't a gap where it is actually present and
         * enabled.
         */
        NextDisabledValidators: StorageDescriptor<[Key: SS58String], null, true, never>;
    };
    Session: {
        /**
         * The current set of validators.
         */
        Validators: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
        /**
         * Current index of the session.
         */
        CurrentIndex: StorageDescriptor<[], number, false, never>;
        /**
         * True if the underlying economic identities or weighting behind the validators
         * has changed in the queued validator set.
         */
        QueuedChanged: StorageDescriptor<[], boolean, false, never>;
        /**
         * The queued keys for the next session. When the next session begins, these keys
         * will be used to determine the validator's session keys.
         */
        QueuedKeys: StorageDescriptor<[], Anonymize<I4nod9ik6g6r96>, false, never>;
        /**
         * Indices of disabled validators.
         *
         * The vec is always kept sorted so that we can find whether a given validator is
         * disabled using binary search. It gets cleared when `on_session_ending` returns
         * a new set of identities.
         */
        DisabledValidators: StorageDescriptor<[], Anonymize<I95g6i7ilua7lq>, false, never>;
        /**
         * The next session keys for a validator.
         */
        NextKeys: StorageDescriptor<[Key: SS58String], Anonymize<I1ls87tb328id3>, true, never>;
        /**
         * The owner of a key. The key is the `KeyTypeId` + the encoded key.
         */
        KeyOwner: StorageDescriptor<[Key: Anonymize<I82jm9g7pufuel>], SS58String, true, never>;
    };
    Grandpa: {
        /**
         * State of the current authority set.
         */
        State: StorageDescriptor<[], GrandpaStoredState, false, never>;
        /**
         * Pending change: (signaled at, scheduled change).
         */
        PendingChange: StorageDescriptor<[], Anonymize<I7pe2me3i3vtn9>, true, never>;
        /**
         * next block number where we can force a change.
         */
        NextForced: StorageDescriptor<[], number, true, never>;
        /**
         * `true` if we are currently stalled.
         */
        Stalled: StorageDescriptor<[], Anonymize<I9jd27rnpm8ttv>, true, never>;
        /**
         * The number of changes (both in terms of keys and underlying economic responsibilities)
         * in the "set" of Grandpa validators from genesis.
         */
        CurrentSetId: StorageDescriptor<[], bigint, false, never>;
        /**
         * A mapping from grandpa set ID to the index of the *most recent* session for which its
         * members were responsible.
         *
         * This is only used for validating equivocation proofs. An equivocation proof must
         * contains a key-ownership proof for a given session, therefore we need a way to tie
         * together sessions and GRANDPA set ids, i.e. we need to validate that a validator
         * was the owner of a given key on a given session, and what the active set ID was
         * during that session.
         *
         * TWOX-NOTE: `SetId` is not under user control.
         */
        SetIdSession: StorageDescriptor<[Key: bigint], number, true, never>;
        /**
         * The current list of authorities.
         */
        Authorities: StorageDescriptor<[], Anonymize<I3geksg000c171>, false, never>;
    };
    TransactionStorage: {
        /**
         * Authorizations, keyed by scope.
         */
        Authorizations: StorageDescriptor<[Key: Anonymize<Icd998p53cb80u>], Anonymize<I52552vmt51a1m>, true, never>;
        /**
         * Collection of transaction metadata by block number.
         */
        Transactions: StorageDescriptor<[Key: number], Anonymize<Ianratlvp36bb8>, true, never>;
        /**
         * Storage fee per byte.
         */
        ByteFee: StorageDescriptor<[], bigint, true, never>;
        /**
         * Storage fee per transaction.
         */
        EntryFee: StorageDescriptor<[], bigint, true, never>;
        /**
         * Number of blocks for which stored data must be retained.
         *
         * Data older than `RetentionPeriod` blocks is eligible for removal unless it
         * has been explicitly renewed. Validators are required to prove possession of
         * data corresponding to block `N - RetentionPeriod` when producing block `N`.
         */
        RetentionPeriod: StorageDescriptor<[], number, false, never>;
        /**
        
         */
        BlockTransactions: StorageDescriptor<[], Anonymize<Ianratlvp36bb8>, false, never>;
        /**
         * Was the proof checked in this block?
         */
        ProofChecked: StorageDescriptor<[], boolean, false, never>;
        /**
         * Ephemeral value killed on the block finalization. So it never ends up in the storage trie.
         * (Used by [`extension::ProvideCidConfig`])
         */
        CidConfigForStore: StorageDescriptor<[], Anonymize<Idftgde1j2kabb>, true, never>;
    };
    RelayerSet: {
        /**
         * Relayer set. Unlike eg the validator set, changes to this take effect immediately.
         */
        Relayers: StorageDescriptor<[Key: SS58String], number, true, never>;
    };
    BridgePolkadotGrandpa: {
        /**
         * Number of free header submissions that we may yet accept in the current block.
         *
         * If the `FreeHeadersRemaining` hits zero, all following mandatory headers in the
         * current block are accepted with fee (`Pays::Yes` is returned).
         *
         * The `FreeHeadersRemaining` is an ephemeral value that is set to
         * `MaxFreeHeadersPerBlock` at each block initialization and is killed on block
         * finalization. So it never ends up in the storage trie.
         */
        FreeHeadersRemaining: StorageDescriptor<[], number, true, never>;
        /**
         * Hash of the header used to bootstrap the pallet.
         */
        InitialHash: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
        /**
         * Hash of the best finalized header.
         */
        BestFinalized: StorageDescriptor<[], Anonymize<I4p5t2krb1gmvp>, true, never>;
        /**
         * A ring buffer of imported hashes. Ordered by the insertion time.
         */
        ImportedHashes: StorageDescriptor<[Key: number], FixedSizeBinary<32>, true, never>;
        /**
         * Current ring buffer position.
         */
        ImportedHashesPointer: StorageDescriptor<[], number, false, never>;
        /**
         * Relevant fields of imported headers.
         */
        ImportedHeaders: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I67smi4kj2jg4u>, true, never>;
        /**
         * The current GRANDPA Authority set.
         */
        CurrentAuthoritySet: StorageDescriptor<[], Anonymize<I74nture9pgqeq>, false, never>;
        /**
         * Optional pallet owner.
         *
         * Pallet owner has a right to halt all pallet operations and then resume it. If it is
         * `None`, then there are no direct ways to halt/resume pallet operations, but other
         * runtime methods may still be used to do that (i.e. democracy::referendum to update halt
         * flag directly or call the `set_operating_mode`).
         */
        PalletOwner: StorageDescriptor<[], SS58String, true, never>;
        /**
         * The current operating mode of the pallet.
         *
         * Depending on the mode either all, or no transactions will be allowed.
         */
        PalletOperatingMode: StorageDescriptor<[], Anonymize<Ibqjcgmcid3dll>, false, never>;
    };
    BridgePolkadotParachains: {
        /**
         * Optional pallet owner.
         *
         * Pallet owner has a right to halt all pallet operations and then resume them. If it is
         * `None`, then there are no direct ways to halt/resume pallet operations, but other
         * runtime methods may still be used to do that (i.e. democracy::referendum to update halt
         * flag directly or call the `set_operating_mode`).
         */
        PalletOwner: StorageDescriptor<[], SS58String, true, never>;
        /**
         * The current operating mode of the pallet.
         *
         * Depending on the mode either all, or no transactions will be allowed.
         */
        PalletOperatingMode: StorageDescriptor<[], Anonymize<Ibqjcgmcid3dll>, false, never>;
        /**
         * Parachains info.
         *
         * Contains the following info:
         * - best parachain head hash
         * - the head of the `ImportedParaHashes` ring buffer
         */
        ParasInfo: StorageDescriptor<[Key: number], Anonymize<Id15d558jgoqcl>, true, never>;
        /**
         * State roots of parachain heads which have been imported into the pallet.
         */
        ImportedParaHeads: StorageDescriptor<Anonymize<I4p5t2krb1gmvp>, Binary, true, never>;
        /**
         * A ring buffer of imported parachain head hashes. Ordered by the insertion time.
         */
        ImportedParaHashes: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, FixedSizeBinary<32>, true, never>;
    };
    BridgePolkadotMessages: {
        /**
         * Optional pallet owner.
         *
         * Pallet owner has a right to halt all pallet operations and then resume it. If it is
         * `None`, then there are no direct ways to halt/resume pallet operations, but other
         * runtime methods may still be used to do that (i.e. democracy::referendum to update halt
         * flag directly or call the `set_operating_mode`).
         */
        PalletOwner: StorageDescriptor<[], SS58String, true, never>;
        /**
         * The current operating mode of the pallet.
         *
         * Depending on the mode either all, some, or no transactions will be allowed.
         */
        PalletOperatingMode: StorageDescriptor<[], Anonymize<Icdpdqb1rbmstf>, false, never>;
        /**
         * Map of lane id => inbound lane data.
         */
        InboundLanes: StorageDescriptor<[Key: FixedSizeBinary<4>], Anonymize<I1rnotsmqcgi9a>, true, never>;
        /**
         * Map of lane id => outbound lane data.
         */
        OutboundLanes: StorageDescriptor<[Key: FixedSizeBinary<4>], Anonymize<I84l6vdi7riqfe>, true, never>;
        /**
         * All queued outbound messages.
         */
        OutboundMessages: StorageDescriptor<[Key: Anonymize<Iktdie89uk6pa>], Binary, true, never>;
    };
    Sudo: {
        /**
         * The `AccountId` of the sudo key.
         */
        Key: StorageDescriptor<[], SS58String, true, never>;
    };
    Proxy: {
        /**
         * The set of account proxies. Maps the account which has delegated to the accounts
         * which are being delegated to, together with the amount held on deposit.
         */
        Proxies: StorageDescriptor<[Key: SS58String], Anonymize<I775lbh1002e7f>, false, never>;
        /**
         * The announcements made by the proxy (key).
         */
        Announcements: StorageDescriptor<[Key: SS58String], Anonymize<I9p9lq3rej5bhc>, false, never>;
    };
};
type ICalls = {
    System: {
        /**
         * Make some on-chain remark.
         *
         * Can be executed by every `origin`.
         */
        remark: TxDescriptor<Anonymize<I8ofcg5rbj0g2c>>;
        /**
         * Set the number of pages in the WebAssembly environment's heap.
         */
        set_heap_pages: TxDescriptor<Anonymize<I4adgbll7gku4i>>;
        /**
         * Set the new runtime code.
         */
        set_code: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
        /**
         * Set the new runtime code without doing any checks of the given `code`.
         *
         * Note that runtime upgrades will not run if this is called with a not-increasing spec
         * version!
         */
        set_code_without_checks: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
        /**
         * Set some items of storage.
         */
        set_storage: TxDescriptor<Anonymize<I9pj91mj79qekl>>;
        /**
         * Kill some items from storage.
         */
        kill_storage: TxDescriptor<Anonymize<I39uah9nss64h9>>;
        /**
         * Kill all storage items with a key that starts with the given prefix.
         *
         * **NOTE:** We rely on the Root origin to provide us the number of subkeys under
         * the prefix we are removing to accurately calculate the weight of this function.
         */
        kill_prefix: TxDescriptor<Anonymize<Ik64dknsq7k08>>;
        /**
         * Make some on-chain remark and emit event.
         */
        remark_with_event: TxDescriptor<Anonymize<I8ofcg5rbj0g2c>>;
        /**
         * Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
         * later.
         *
         * This call requires Root origin.
         */
        authorize_upgrade: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
        /**
         * Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
         * later.
         *
         * WARNING: This authorizes an upgrade that will take place without any safety checks, for
         * example that the spec name remains the same and that the version number increases. Not
         * recommended for normal use. Use `authorize_upgrade` instead.
         *
         * This call requires Root origin.
         */
        authorize_upgrade_without_checks: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
        /**
         * Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
         *
         * If the authorization required a version check, this call will ensure the spec name
         * remains unchanged and that the spec version has increased.
         *
         * Depending on the runtime's `OnSetCode` configuration, this function may directly apply
         * the new `code` in the same block or attempt to schedule the upgrade.
         *
         * All origins are allowed.
         */
        apply_authorized_upgrade: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
    };
    Babe: {
        /**
         * Report authority equivocation/misbehavior. This method will verify
         * the equivocation proof and validate the given key ownership proof
         * against the extracted offender. If both are valid, the offence will
         * be reported.
         */
        report_equivocation: TxDescriptor<Anonymize<I50ppnqasq4tjq>>;
        /**
         * Report authority equivocation/misbehavior. This method will verify
         * the equivocation proof and validate the given key ownership proof
         * against the extracted offender. If both are valid, the offence will
         * be reported.
         * This extrinsic must be called unsigned and it is expected that only
         * block authors will call it (validated in `ValidateUnsigned`), as such
         * if the block author is defined it will be defined as the equivocation
         * reporter.
         */
        report_equivocation_unsigned: TxDescriptor<Anonymize<I50ppnqasq4tjq>>;
        /**
         * Plan an epoch config change. The epoch config change is recorded and will be enacted on
         * the next call to `enact_epoch_change`. The config will be activated one epoch after.
         * Multiple calls to this method will replace any existing planned config change that had
         * not been enacted yet.
         */
        plan_config_change: TxDescriptor<Anonymize<I9fin09kkg0jaj>>;
    };
    Timestamp: {
        /**
         * Set the current time.
         *
         * This call should be invoked exactly once per block. It will panic at the finalization
         * phase, if this call hasn't been invoked by that time.
         *
         * The timestamp should be greater than the previous one by the amount specified by
         * [`Config::MinimumPeriod`].
         *
         * The dispatch origin for this call must be _None_.
         *
         * This dispatch class is _Mandatory_ to ensure it gets executed in the block. Be aware
         * that changing the complexity of this call could result exhausting the resources in a
         * block to execute any other calls.
         *
         * ## Complexity
         * - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
         * - 1 storage read and 1 storage mutation (codec `O(1)` because of `DidUpdate::take` in
         * `on_finalize`)
         * - 1 event handler `on_timestamp_set`. Must be `O(1)`.
         */
        set: TxDescriptor<Anonymize<Idcr6u6361oad9>>;
    };
    ValidatorSet: {
        /**
         * Add a new validator.
         *
         * This will increment the validator's provider reference count, allowing the validator to
         * call [`set_keys`](pallet_session::Pallet::set_keys).
         *
         * Provided the validator calls `set_keys` in time, the addition will take effect the
         * session after next.
         *
         * The origin for this call must be the pallet's `AddRemoveOrigin`. Emits
         * [`ValidatorAdded`](Event::ValidatorAdded) when successful.
         */
        add_validator: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Remove a validator.
         *
         * This will purge the validator's session keys and decrement the validator's provider
         * reference count.
         *
         * The removal will take effect the session after next.
         *
         * The origin for this call must be the pallet's `AddRemoveOrigin`. Emits
         * [`ValidatorRemoved`](Event::ValidatorRemoved) when successful.
         */
        remove_validator: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
    };
    Session: {
        /**
         * Sets the session key(s) of the function caller to `keys`.
         *
         * Allows an account to set its session key prior to becoming a validator.
         * This doesn't take effect until the next session.
         *
         * - `origin`: The dispatch origin of this function must be signed.
         * - `keys`: The new session keys to set. These are the public keys of all sessions keys
         * setup in the runtime.
         * - `proof`: The proof that `origin` has access to the private keys of `keys`. See
         * [`impl_opaque_keys`](sp_runtime::impl_opaque_keys) for more information about the
         * proof format.
         */
        set_keys: TxDescriptor<Anonymize<I3aiifqvqrbar5>>;
        /**
         * Removes any session key(s) of the function caller.
         *
         * This doesn't take effect until the next session.
         *
         * The dispatch origin of this function must be Signed and the account must be either be
         * convertible to a validator ID using the chain's typical addressing system (this usually
         * means being a controller account) or directly convertible into a validator ID (which
         * usually means being a stash account).
         */
        purge_keys: TxDescriptor<undefined>;
    };
    Grandpa: {
        /**
         * Report voter equivocation/misbehavior. This method will verify the
         * equivocation proof and validate the given key ownership proof
         * against the extracted offender. If both are valid, the offence
         * will be reported.
         */
        report_equivocation: TxDescriptor<Anonymize<I7ne83r38c2sqq>>;
        /**
         * Report voter equivocation/misbehavior. This method will verify the
         * equivocation proof and validate the given key ownership proof
         * against the extracted offender. If both are valid, the offence
         * will be reported.
         *
         * This extrinsic must be called unsigned and it is expected that only
         * block authors will call it (validated in `ValidateUnsigned`), as such
         * if the block author is defined it will be defined as the equivocation
         * reporter.
         */
        report_equivocation_unsigned: TxDescriptor<Anonymize<I7ne83r38c2sqq>>;
        /**
         * Note that the current authority set of the GRANDPA finality gadget has stalled.
         *
         * This will trigger a forced authority set change at the beginning of the next session, to
         * be enacted `delay` blocks after that. The `delay` should be high enough to safely assume
         * that the block signalling the forced change will not be re-orged e.g. 1000 blocks.
         * The block production rate (which may be slowed down because of finality lagging) should
         * be taken into account when choosing the `delay`. The GRANDPA voters based on the new
         * authority will start voting on top of `best_finalized_block_number` for new finalized
         * blocks. `best_finalized_block_number` should be the highest of the latest finalized
         * block of all validators of the new authority set.
         *
         * Only callable by root.
         */
        note_stalled: TxDescriptor<Anonymize<I2hviml3snvhhn>>;
    };
    TransactionStorage: {
        /**
         * Index and store data off chain. Minimum data size is 1 byte, maximum is
         * `MaxTransactionSize`. Data will be removed after `RetentionPeriod` blocks, unless
         * `renew` is called.
         *
         * Authorization is required to store data using regular signed/unsigned transactions.
         * Regular signed transactions require account authorization (see
         * [`authorize_account`](Self::authorize_account)), regular unsigned transactions require
         * preimage authorization (see [`authorize_preimage`](Self::authorize_preimage)).
         *
         * Emits [`Stored`](Event::Stored) when successful.
         *
         * ## Complexity
         *
         * O(n*log(n)) of data size, as all data is pushed to an in-memory trie.
         */
        store: TxDescriptor<Anonymize<Itrlf5b2o2l8q>>;
        /**
         * Renew previously stored data. Parameters are the block number that contains previous
         * `store` or `renew` call and transaction index within that block. Transaction index is
         * emitted in the `Stored` or `Renewed` event.
         *
         * As with [`store`](Self::store), authorization is required to renew data using regular
         * signed/unsigned transactions.
         *
         * Emits [`Renewed`](Event::Renewed) when successful.
         *
         * ## Complexity
         *
         * O(1).
         */
        renew: TxDescriptor<Anonymize<I4vj3ndsquheo1>>;
        /**
         * Check storage proof for block number `block_number() - RetentionPeriod`. If such a block
         * does not exist, the proof is expected to be `None`.
         *
         * ## Complexity
         *
         * Linear w.r.t the number of indexed transactions in the proved block for random probing.
         * There's a DB read for each transaction.
         */
        check_proof: TxDescriptor<Anonymize<I7h5kud22qmfsg>>;
        /**
         * Authorize an account to store up to a given amount of arbitrary data. The authorization
         * will expire after a configured number of blocks.
         *
         * If the account is already authorized to store data, this will increase the amount of
         * data the account is authorized to store (and the number of transactions the account may
         * submit to supply the data), and push back the expiration block.
         *
         * Parameters:
         *
         * - `who`: The account to be credited with an authorization to store data.
         * - `transactions`: The number of transactions that `who` may submit to supply that data.
         * - `bytes`: The number of bytes that `who` may submit.
         *
         * The origin for this call must be the pallet's `Authorizer`. Emits
         * [`AccountAuthorized`](Event::AccountAuthorized) when successful.
         */
        authorize_account: TxDescriptor<Anonymize<I2i8iea6e4ne1j>>;
        /**
         * Authorize anyone to store a preimage of the given BLAKE2b hash. The authorization will
         * expire after a configured number of blocks.
         *
         * If authorization already exists for a preimage of the given hash to be stored, the
         * maximum size of the preimage will be increased to `max_size`, and the expiration block
         * will be pushed back.
         *
         * Parameters:
         *
         * - `content_hash`: The BLAKE2b hash of the data to be submitted.
         * - `max_size`: The maximum size, in bytes, of the preimage.
         *
         * The origin for this call must be the pallet's `Authorizer`. Emits
         * [`PreimageAuthorized`](Event::PreimageAuthorized) when successful.
         */
        authorize_preimage: TxDescriptor<Anonymize<I4jotama61aldv>>;
        /**
         * Remove an expired account authorization from storage. Anyone can call this.
         *
         * Parameters:
         *
         * - `who`: The account with an expired authorization to remove.
         *
         * Emits [`ExpiredAccountAuthorizationRemoved`](Event::ExpiredAccountAuthorizationRemoved)
         * when successful.
         */
        remove_expired_account_authorization: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Remove an expired preimage authorization from storage. Anyone can call this.
         *
         * Parameters:
         *
         * - `content_hash`: The BLAKE2b hash that was authorized.
         *
         * Emits
         * [`ExpiredPreimageAuthorizationRemoved`](Event::ExpiredPreimageAuthorizationRemoved)
         * when successful.
         */
        remove_expired_preimage_authorization: TxDescriptor<Anonymize<I3rfugj0vt1ug5>>;
        /**
         * Refresh the expiration of an existing authorization for an account.
         *
         * If the account does not have an authorization, the call will fail.
         *
         * Parameters:
         *
         * - `who`: The account to be credited with an authorization to store data.
         *
         * The origin for this call must be the pallet's `Authorizer`. Emits
         * [`AccountAuthorizationRefreshed`](Event::AccountAuthorizationRefreshed) when successful.
         */
        refresh_account_authorization: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Refresh the expiration of an existing authorization for a preimage of a BLAKE2b hash.
         *
         * If the preimage does not have an authorization, the call will fail.
         *
         * Parameters:
         *
         * - `content_hash`: The BLAKE2b hash of the data to be submitted.
         *
         * The origin for this call must be the pallet's `Authorizer`. Emits
         * [`PreimageAuthorizationRefreshed`](Event::PreimageAuthorizationRefreshed) when
         * successful.
         */
        refresh_preimage_authorization: TxDescriptor<Anonymize<I3rfugj0vt1ug5>>;
    };
    RelayerSet: {
        /**
         * Add a new relayer.
         *
         * The origin for this call must be the pallet's `AddRemoveOrigin`. Emits
         * [`RelayerAdded`](Event::RelayerAdded) when successful.
         */
        add_relayer: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Remove a relayer.
         *
         * The origin for this call must be the pallet's `AddRemoveOrigin`. Emits
         * [`RelayerRemoved`](Event::RelayerRemoved) when successful.
         */
        remove_relayer: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
    };
    BridgePolkadotGrandpa: {
        /**
         * This call is deprecated and will be removed around May 2024. Use the
         * `submit_finality_proof_ex` instead. Semantically, this call is an equivalent of the
         * `submit_finality_proof_ex` call without current authority set id check.
         */
        submit_finality_proof: TxDescriptor<Anonymize<I29mlfpi57nes9>>;
        /**
         * Bootstrap the bridge pallet with an initial header and authority set from which to sync.
         *
         * The initial configuration provided does not need to be the genesis header of the bridged
         * chain, it can be any arbitrary header. You can also provide the next scheduled set
         * change if it is already know.
         *
         * This function is only allowed to be called from a trusted origin and writes to storage
         * with practically no checks in terms of the validity of the data. It is important that
         * you ensure that valid data is being passed in.
         */
        initialize: TxDescriptor<Anonymize<I9n8t62ile2km9>>;
        /**
         * Change `PalletOwner`.
         *
         * May only be called either by root, or by `PalletOwner`.
         */
        set_owner: TxDescriptor<Anonymize<Iaqek632j1l53f>>;
        /**
         * Halt or resume all pallet operations.
         *
         * May only be called either by root, or by `PalletOwner`.
         */
        set_operating_mode: TxDescriptor<Anonymize<Id3fgg5dtq3ja9>>;
        /**
         * Verify a target header is finalized according to the given finality proof. The proof
         * is assumed to be signed by GRANDPA authorities set with `current_set_id` id.
         *
         * It will use the underlying storage pallet to fetch information about the current
         * authorities and best finalized header in order to verify that the header is finalized.
         *
         * If successful in verification, it will write the target header to the underlying storage
         * pallet.
         *
         * The call fails if:
         *
         * - the pallet is halted;
         *
         * - the pallet knows better header than the `finality_target`;
         *
         * - the id of best GRANDPA authority set, known to the pallet is not equal to the
         * `current_set_id`;
         *
         * - verification is not optimized or invalid;
         *
         * - header contains forced authorities set change or change with non-zero delay.
         *
         * The `is_free_execution_expected` parameter is not really used inside the call. It is
         * used by the transaction extension, which should be registered at the runtime level. If
         * this parameter is `true`, the transaction will be treated as invalid, if the call won't
         * be executed for free. If transaction extension is not used by the runtime, this
         * parameter is not used at all.
         */
        submit_finality_proof_ex: TxDescriptor<Anonymize<I7hl2ljcti73p2>>;
        /**
         * Set current authorities set and best finalized bridged header to given values
         * (almost) without any checks. This call can fail only if:
         *
         * - the call origin is not a root or a pallet owner;
         *
         * - there are too many authorities in the new set.
         *
         * No other checks are made. Previously imported headers stay in the storage and
         * are still accessible after the call.
         */
        force_set_pallet_state: TxDescriptor<Anonymize<I19i0akqkvu7h8>>;
    };
    BridgePolkadotParachains: {
        /**
         * Submit proof of one or several parachain heads.
         *
         * The proof is supposed to be proof of some `Heads` entries from the
         * `polkadot-runtime-parachains::paras` pallet instance, deployed at the bridged chain.
         * The proof is supposed to be crafted at the `relay_header_hash` that must already be
         * imported by corresponding GRANDPA pallet at this chain.
         *
         * The call fails if:
         *
         * - the pallet is halted;
         *
         * - the relay chain block `at_relay_block` is not imported by the associated bridge
         * GRANDPA pallet.
         *
         * The call may succeed, but some heads may not be updated e.g. because pallet knows
         * better head or it isn't tracked by the pallet.
         */
        submit_parachain_heads: TxDescriptor<Anonymize<I4pbpsirgl3tci>>;
        /**
         * Change `PalletOwner`.
         *
         * May only be called either by root, or by `PalletOwner`.
         */
        set_owner: TxDescriptor<Anonymize<Iaqek632j1l53f>>;
        /**
         * Halt or resume all pallet operations.
         *
         * May only be called either by root, or by `PalletOwner`.
         */
        set_operating_mode: TxDescriptor<Anonymize<Id3fgg5dtq3ja9>>;
        /**
         * Submit proof of one or several parachain heads.
         *
         * The proof is supposed to be proof of some `Heads` entries from the
         * `polkadot-runtime-parachains::paras` pallet instance, deployed at the bridged chain.
         * The proof is supposed to be crafted at the `relay_header_hash` that must already be
         * imported by corresponding GRANDPA pallet at this chain.
         *
         * The call fails if:
         *
         * - the pallet is halted;
         *
         * - the relay chain block `at_relay_block` is not imported by the associated bridge
         * GRANDPA pallet.
         *
         * The call may succeed, but some heads may not be updated e.g. because pallet knows
         * better head or it isn't tracked by the pallet.
         *
         * The `is_free_execution_expected` parameter is not really used inside the call. It is
         * used by the transaction extension, which should be registered at the runtime level. If
         * this parameter is `true`, the transaction will be treated as invalid, if the call won't
         * be executed for free. If transaction extension is not used by the runtime, this
         * parameter is not used at all.
         */
        submit_parachain_heads_ex: TxDescriptor<Anonymize<I1be5fgduvh91i>>;
    };
    BridgePolkadotMessages: {
        /**
         * Change `PalletOwner`.
         *
         * May only be called either by root, or by `PalletOwner`.
         */
        set_owner: TxDescriptor<Anonymize<Iaqek632j1l53f>>;
        /**
         * Halt or resume all/some pallet operations.
         *
         * May only be called either by root, or by `PalletOwner`.
         */
        set_operating_mode: TxDescriptor<Anonymize<If7h5asiehgc1m>>;
        /**
         * Receive messages proof from bridged chain.
         *
         * The weight of the call assumes that the transaction always brings outbound lane
         * state update. Because of that, the submitter (relayer) has no benefit of not including
         * this data in the transaction, so reward confirmations lags should be minimal.
         *
         * The call fails if:
         *
         * - the pallet is halted;
         *
         * - the call origin is not `Signed(_)`;
         *
         * - there are too many messages in the proof;
         *
         * - the proof verification procedure returns an error - e.g. because header used to craft
         * proof is not imported by the associated finality pallet;
         *
         * - the `dispatch_weight` argument is not sufficient to dispatch all bundled messages.
         *
         * The call may succeed, but some messages may not be delivered e.g. if they are not fit
         * into the unrewarded relayers vector.
         */
        receive_messages_proof: TxDescriptor<Anonymize<Imfmpjta062dn>>;
        /**
         * Receive messages delivery proof from bridged chain.
         */
        receive_messages_delivery_proof: TxDescriptor<Anonymize<I26u4i5eaerrg9>>;
    };
    Sudo: {
        /**
         * Authenticates the sudo key and dispatches a function call with `Root` origin.
         */
        sudo: TxDescriptor<Anonymize<I5fef7i0ugnvt6>>;
        /**
         * Authenticates the sudo key and dispatches a function call with `Root` origin.
         * This function does not check the weight of the call, and instead allows the
         * Sudo user to specify the weight of the call.
         *
         * The dispatch origin for this call must be _Signed_.
         */
        sudo_unchecked_weight: TxDescriptor<Anonymize<I9s640fgd7ljnm>>;
        /**
         * Authenticates the current sudo key and sets the given AccountId (`new`) as the new sudo
         * key.
         */
        set_key: TxDescriptor<Anonymize<I8k3rnvpeeh4hv>>;
        /**
         * Authenticates the sudo key and dispatches a function call with `Signed` origin from
         * a given account.
         *
         * The dispatch origin for this call must be _Signed_.
         */
        sudo_as: TxDescriptor<Anonymize<I7mprq7fgt4l8r>>;
        /**
         * Permanently removes the sudo key.
         *
         * **This cannot be un-done.**
         */
        remove_key: TxDescriptor<undefined>;
    };
    Proxy: {
        /**
         * Dispatch the given `call` from an account that the sender is authorised for through
         * `add_proxy`.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
         * - `call`: The call to be made by the `real` account.
         */
        proxy: TxDescriptor<Anonymize<I5s6rsjmb12ktk>>;
        /**
         * Register a proxy account for the sender that is able to make calls on its behalf.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `proxy`: The account that the `caller` would like to make a proxy.
         * - `proxy_type`: The permissions allowed for this proxy account.
         * - `delay`: The announcement period required of the initial proxy. Will generally be
         * zero.
         */
        add_proxy: TxDescriptor<Anonymize<I3lj33btcqlb1i>>;
        /**
         * Unregister a proxy account for the sender.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `proxy`: The account that the `caller` would like to remove as a proxy.
         * - `proxy_type`: The permissions currently enabled for the removed proxy account.
         */
        remove_proxy: TxDescriptor<Anonymize<I3lj33btcqlb1i>>;
        /**
         * Unregister all proxy accounts for the sender.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * WARNING: This may be called on accounts created by `create_pure`, however if done, then
         * the unreserved fees will be inaccessible. **All access to this account will be lost.**
         */
        remove_proxies: TxDescriptor<undefined>;
        /**
         * Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
         * initialize it with a proxy of `proxy_type` for `origin` sender.
         *
         * Requires a `Signed` origin.
         *
         * - `proxy_type`: The type of the proxy that the sender will be registered as over the
         * new account. This will almost always be the most permissive `ProxyType` possible to
         * allow for maximum flexibility.
         * - `index`: A disambiguation index, in case this is called multiple times in the same
         * transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
         * want to use `0`.
         * - `delay`: The announcement period required of the initial proxy. Will generally be
         * zero.
         *
         * Fails with `Duplicate` if this has already been called in this transaction, from the
         * same sender, with the same parameters.
         *
         * Fails if there are insufficient funds to pay for deposit.
         */
        create_pure: TxDescriptor<Anonymize<I707m7edh0jft8>>;
        /**
         * Removes a previously spawned pure proxy.
         *
         * WARNING: **All access to this account will be lost.** Any funds held in it will be
         * inaccessible.
         *
         * Requires a `Signed` origin, and the sender account must have been created by a call to
         * `create_pure` with corresponding parameters.
         *
         * - `spawner`: The account that originally called `create_pure` to create this account.
         * - `index`: The disambiguation index originally passed to `create_pure`. Probably `0`.
         * - `proxy_type`: The proxy type originally passed to `create_pure`.
         * - `height`: The height of the chain when the call to `create_pure` was processed.
         * - `ext_index`: The extrinsic index in which the call to `create_pure` was processed.
         *
         * Fails with `NoPermission` in case the caller is not a previously created pure
         * account whose `create_pure` call has corresponding parameters.
         */
        kill_pure: TxDescriptor<Anonymize<I2j5sqe1l974kn>>;
        /**
         * Publish the hash of a proxy-call that will be made in the future.
         *
         * This must be called some number of blocks before the corresponding `proxy` is attempted
         * if the delay associated with the proxy relationship is greater than zero.
         *
         * No more than `MaxPending` announcements may be made at any one time.
         *
         * This will take a deposit of `AnnouncementDepositFactor` as well as
         * `AnnouncementDepositBase` if there are no other pending announcements.
         *
         * The dispatch origin for this call must be _Signed_ and a proxy of `real`.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `call_hash`: The hash of the call to be made by the `real` account.
         */
        announce: TxDescriptor<Anonymize<I2eb501t8s6hsq>>;
        /**
         * Remove a given announcement.
         *
         * May be called by a proxy account to remove a call they previously announced and return
         * the deposit.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `call_hash`: The hash of the call to be made by the `real` account.
         */
        remove_announcement: TxDescriptor<Anonymize<I2eb501t8s6hsq>>;
        /**
         * Remove the given announcement of a delegate.
         *
         * May be called by a target (proxied) account to remove a call that one of their delegates
         * (`delegate`) has announced they want to execute. The deposit is returned.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `delegate`: The account that previously announced the call.
         * - `call_hash`: The hash of the call to be made.
         */
        reject_announcement: TxDescriptor<Anonymize<Ianmuoljk2sk1u>>;
        /**
         * Dispatch the given `call` from an account that the sender is authorized for through
         * `add_proxy`.
         *
         * Removes any corresponding announcement(s).
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
         * - `call`: The call to be made by the `real` account.
         */
        proxy_announced: TxDescriptor<Anonymize<I6m5tiqkcapv48>>;
        /**
         * Poke / Adjust deposits made for proxies and announcements based on current values.
         * This can be used by accounts to possibly lower their locked amount.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * The transaction fee is waived if the deposit amount has changed.
         *
         * Emits `DepositPoked` if successful.
         */
        poke_deposit: TxDescriptor<undefined>;
    };
};
type IEvent = {
    System: {
        /**
         * An extrinsic completed successfully.
         */
        ExtrinsicSuccess: PlainDescriptor<Anonymize<Ia82mnkmeo2rhc>>;
        /**
         * An extrinsic failed.
         */
        ExtrinsicFailed: PlainDescriptor<Anonymize<Isag1cdadd68s>>;
        /**
         * `:code` was updated.
         */
        CodeUpdated: PlainDescriptor<undefined>;
        /**
         * A new account was created.
         */
        NewAccount: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
        /**
         * An account was reaped.
         */
        KilledAccount: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
        /**
         * On on-chain remark happened.
         */
        Remarked: PlainDescriptor<Anonymize<I855j4i3kr8ko1>>;
        /**
         * An upgrade was authorized.
         */
        UpgradeAuthorized: PlainDescriptor<Anonymize<Ibgl04rn6nbfm6>>;
        /**
         * An invalid authorized upgrade was rejected while trying to apply it.
         */
        RejectedInvalidAuthorizedUpgrade: PlainDescriptor<Anonymize<Ifj3vvvojic2ac>>;
    };
    Offences: {
        /**
         * There is an offence reported of the given `kind` happened at the `session_index` and
         * (kind-specific) time slot. This event is not deposited for duplicate slashes.
         * \[kind, timeslot\].
         */
        Offence: PlainDescriptor<Anonymize<Iempvdlhc5ih6g>>;
    };
    Historical: {
        /**
         * The merkle root of the validators of the said session were stored
         */
        RootStored: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * The merkle roots of up to this session index were pruned
         */
        RootsPruned: PlainDescriptor<Anonymize<I85icj2qbjeqbe>>;
    };
    ValidatorSet: {
        /**
         * New validator added. Effective in session after next.
         */
        ValidatorAdded: PlainDescriptor<SS58String>;
        /**
         * Validator removed. Effective in session after next.
         */
        ValidatorRemoved: PlainDescriptor<SS58String>;
    };
    Session: {
        /**
         * New session has happened. Note that the argument is the session index, not the
         * block number as the type might suggest.
         */
        NewSession: PlainDescriptor<Anonymize<I2hq50pu2kdjpo>>;
        /**
         * The `NewSession` event in the current block also implies a new validator set to be
         * queued.
         */
        NewQueued: PlainDescriptor<undefined>;
        /**
         * Validator has been disabled.
         */
        ValidatorDisabled: PlainDescriptor<Anonymize<I9acqruh7322g2>>;
        /**
         * Validator has been re-enabled.
         */
        ValidatorReenabled: PlainDescriptor<Anonymize<I9acqruh7322g2>>;
    };
    Grandpa: {
        /**
         * New authority set has been applied.
         */
        NewAuthorities: PlainDescriptor<Anonymize<I5768ac424h061>>;
        /**
         * Current authority set has been paused.
         */
        Paused: PlainDescriptor<undefined>;
        /**
         * Current authority set has been resumed.
         */
        Resumed: PlainDescriptor<undefined>;
    };
    TransactionStorage: {
        /**
         * Stored data under specified index.
         */
        Stored: PlainDescriptor<Anonymize<Ibrq4vd4dm959l>>;
        /**
         * Renewed data under specified index.
         */
        Renewed: PlainDescriptor<Anonymize<I66jdpl6lile9j>>;
        /**
         * Storage proof was successfully checked.
         */
        ProofChecked: PlainDescriptor<undefined>;
        /**
         * An account `who` was authorized to store `bytes` bytes in `transactions` transactions.
         */
        AccountAuthorized: PlainDescriptor<Anonymize<I2i8iea6e4ne1j>>;
        /**
         * An authorization for account `who` was refreshed.
         */
        AccountAuthorizationRefreshed: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Authorization was given for a preimage of `content_hash` (not exceeding `max_size`) to
         * be stored by anyone.
         */
        PreimageAuthorized: PlainDescriptor<Anonymize<I4jotama61aldv>>;
        /**
         * An authorization for a preimage of `content_hash` was refreshed.
         */
        PreimageAuthorizationRefreshed: PlainDescriptor<Anonymize<I3rfugj0vt1ug5>>;
        /**
         * An expired account authorization was removed.
         */
        ExpiredAccountAuthorizationRemoved: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * An expired preimage authorization was removed.
         */
        ExpiredPreimageAuthorizationRemoved: PlainDescriptor<Anonymize<I3rfugj0vt1ug5>>;
    };
    RelayerSet: {
        /**
         * New relayer added.
         */
        RelayerAdded: PlainDescriptor<SS58String>;
        /**
         * Relayer removed.
         */
        RelayerRemoved: PlainDescriptor<SS58String>;
    };
    BridgePolkadotGrandpa: {
        /**
         * Best finalized chain header has been updated to the header with given number and hash.
         */
        UpdatedBestFinalizedHeader: PlainDescriptor<Anonymize<Id4cm1n8k2kug1>>;
    };
    BridgePolkadotParachains: {
        /**
         * The caller has provided head of parachain that the pallet is not configured to track.
         */
        UntrackedParachainRejected: PlainDescriptor<Anonymize<I6p1tq74832j8u>>;
        /**
         * The caller has declared that he has provided given parachain head, but it is missing
         * from the storage proof.
         */
        MissingParachainHead: PlainDescriptor<Anonymize<I6p1tq74832j8u>>;
        /**
         * The caller has provided parachain head hash that is not matching the hash read from the
         * storage proof.
         */
        IncorrectParachainHeadHash: PlainDescriptor<Anonymize<Ij76tvu0faddj>>;
        /**
         * The caller has provided obsolete parachain head, which is already known to the pallet.
         */
        RejectedObsoleteParachainHead: PlainDescriptor<Anonymize<I6r44prunlrgaa>>;
        /**
         * The caller has provided parachain head that exceeds the maximal configured head size.
         */
        RejectedLargeParachainHead: PlainDescriptor<Anonymize<I6b8h9eitutv15>>;
        /**
         * Parachain head has been updated.
         */
        UpdatedParachainHead: PlainDescriptor<Anonymize<I6r44prunlrgaa>>;
    };
    BridgePolkadotMessages: {
        /**
         * Message has been accepted and is waiting to be delivered.
         */
        MessageAccepted: PlainDescriptor<Anonymize<Iktdie89uk6pa>>;
        /**
         * Messages have been received from the bridged chain.
         */
        MessagesReceived: PlainDescriptor<Anonymize<I34pucbefgbh7>>;
        /**
         * Messages in the inclusive range have been delivered to the bridged chain.
         */
        MessagesDelivered: PlainDescriptor<Anonymize<I3hmd9tck40707>>;
    };
    Sudo: {
        /**
         * A sudo call just took place.
         */
        Sudid: PlainDescriptor<Anonymize<I4cj2rds2sto1k>>;
        /**
         * The sudo key has been updated.
         */
        KeyChanged: PlainDescriptor<Anonymize<I5rtkmhm2dng4u>>;
        /**
         * The key was permanently removed.
         */
        KeyRemoved: PlainDescriptor<undefined>;
        /**
         * A [sudo_as](Pallet::sudo_as) call just took place.
         */
        SudoAsDone: PlainDescriptor<Anonymize<I4cj2rds2sto1k>>;
    };
    Proxy: {
        /**
         * A proxy was executed correctly, with the given.
         */
        ProxyExecuted: PlainDescriptor<Anonymize<Iao67k11hfu3mi>>;
        /**
         * A pure account has been created by new proxy with given
         * disambiguation index and proxy type.
         */
        PureCreated: PlainDescriptor<Anonymize<Icovh3ggbhth1s>>;
        /**
         * A pure proxy was killed by its spawner.
         */
        PureKilled: PlainDescriptor<Anonymize<I8a8c1n38ann55>>;
        /**
         * An announcement was placed to make a call in the future.
         */
        Announced: PlainDescriptor<Anonymize<I2ur0oeqg495j8>>;
        /**
         * A proxy was added.
         */
        ProxyAdded: PlainDescriptor<Anonymize<I7f2f3co93gefl>>;
        /**
         * A proxy was removed.
         */
        ProxyRemoved: PlainDescriptor<Anonymize<I7f2f3co93gefl>>;
        /**
         * A deposit stored for proxies or announcements was poked / updated.
         */
        DepositPoked: PlainDescriptor<Anonymize<I1bhd210c3phjj>>;
    };
};
type IError = {
    System: {
        /**
         * The name of specification does not match between the current runtime
         * and the new runtime.
         */
        InvalidSpecName: PlainDescriptor<undefined>;
        /**
         * The specification version is not allowed to decrease between the current runtime
         * and the new runtime.
         */
        SpecVersionNeedsToIncrease: PlainDescriptor<undefined>;
        /**
         * Failed to extract the runtime version from the new runtime.
         *
         * Either calling `Core_version` or decoding `RuntimeVersion` failed.
         */
        FailedToExtractRuntimeVersion: PlainDescriptor<undefined>;
        /**
         * Suicide called when the account has non-default composite data.
         */
        NonDefaultComposite: PlainDescriptor<undefined>;
        /**
         * There is a non-zero reference count preventing the account from being purged.
         */
        NonZeroRefCount: PlainDescriptor<undefined>;
        /**
         * The origin filter prevent the call to be dispatched.
         */
        CallFiltered: PlainDescriptor<undefined>;
        /**
         * A multi-block migration is ongoing and prevents the current code from being replaced.
         */
        MultiBlockMigrationsOngoing: PlainDescriptor<undefined>;
        /**
         * No upgrade authorized.
         */
        NothingAuthorized: PlainDescriptor<undefined>;
        /**
         * The submitted code is not authorized.
         */
        Unauthorized: PlainDescriptor<undefined>;
    };
    Babe: {
        /**
         * An equivocation proof provided as part of an equivocation report is invalid.
         */
        InvalidEquivocationProof: PlainDescriptor<undefined>;
        /**
         * A key ownership proof provided as part of an equivocation report is invalid.
         */
        InvalidKeyOwnershipProof: PlainDescriptor<undefined>;
        /**
         * A given equivocation report is valid but already previously reported.
         */
        DuplicateOffenceReport: PlainDescriptor<undefined>;
        /**
         * Submitted configuration is invalid.
         */
        InvalidConfiguration: PlainDescriptor<undefined>;
    };
    ValidatorSet: {
        /**
         * Validator is already in the validator set.
         */
        Duplicate: PlainDescriptor<undefined>;
        /**
         * Validator is not in the validator set.
         */
        NotAValidator: PlainDescriptor<undefined>;
        /**
         * Adding the validator would take the validator count above the maximum.
         */
        TooManyValidators: PlainDescriptor<undefined>;
    };
    Session: {
        /**
         * Invalid ownership proof.
         */
        InvalidProof: PlainDescriptor<undefined>;
        /**
         * No associated validator ID for account.
         */
        NoAssociatedValidatorId: PlainDescriptor<undefined>;
        /**
         * Registered duplicate key.
         */
        DuplicatedKey: PlainDescriptor<undefined>;
        /**
         * No keys are associated with this account.
         */
        NoKeys: PlainDescriptor<undefined>;
        /**
         * Key setting account is not live, so it's impossible to associate keys.
         */
        NoAccount: PlainDescriptor<undefined>;
    };
    Grandpa: {
        /**
         * Attempt to signal GRANDPA pause when the authority set isn't live
         * (either paused or already pending pause).
         */
        PauseFailed: PlainDescriptor<undefined>;
        /**
         * Attempt to signal GRANDPA resume when the authority set isn't paused
         * (either live or already pending resume).
         */
        ResumeFailed: PlainDescriptor<undefined>;
        /**
         * Attempt to signal GRANDPA change with one already pending.
         */
        ChangePending: PlainDescriptor<undefined>;
        /**
         * Cannot signal forced change so soon after last.
         */
        TooSoon: PlainDescriptor<undefined>;
        /**
         * A key ownership proof provided as part of an equivocation report is invalid.
         */
        InvalidKeyOwnershipProof: PlainDescriptor<undefined>;
        /**
         * An equivocation proof provided as part of an equivocation report is invalid.
         */
        InvalidEquivocationProof: PlainDescriptor<undefined>;
        /**
         * A given equivocation report is valid but already previously reported.
         */
        DuplicateOffenceReport: PlainDescriptor<undefined>;
    };
    TransactionStorage: {
        /**
         * Attempted to call `store`/`renew` outside of block execution.
         */
        BadContext: PlainDescriptor<undefined>;
        /**
         * Data size is not in the allowed range.
         */
        BadDataSize: PlainDescriptor<undefined>;
        /**
         * Too many transactions in the block.
         */
        TooManyTransactions: PlainDescriptor<undefined>;
        /**
         * Invalid configuration.
         */
        NotConfigured: PlainDescriptor<undefined>;
        /**
         * Renewed extrinsic is not found.
         */
        RenewedNotFound: PlainDescriptor<undefined>;
        /**
         * Proof was not expected in this block.
         */
        UnexpectedProof: PlainDescriptor<undefined>;
        /**
         * Proof failed verification.
         */
        InvalidProof: PlainDescriptor<undefined>;
        /**
         * Missing storage proof.
         */
        MissingProof: PlainDescriptor<undefined>;
        /**
         * Unable to verify proof because state data is missing.
         */
        MissingStateData: PlainDescriptor<undefined>;
        /**
         * Double proof check in the block.
         */
        DoubleCheck: PlainDescriptor<undefined>;
        /**
         * Storage proof was not checked in the block.
         */
        ProofNotChecked: PlainDescriptor<undefined>;
        /**
         * Authorization was not found.
         */
        AuthorizationNotFound: PlainDescriptor<undefined>;
        /**
         * Authorization has not expired.
         */
        AuthorizationNotExpired: PlainDescriptor<undefined>;
        /**
         * Content hash was not calculated.
         */
        InvalidContentHash: PlainDescriptor<undefined>;
    };
    RelayerSet: {
        /**
         * Relayer is already in the relayer set.
         */
        Duplicate: PlainDescriptor<undefined>;
        /**
         * Relayer is not in the relayer set.
         */
        NotARelayer: PlainDescriptor<undefined>;
    };
    BridgePolkadotGrandpa: {
        /**
         * The given justification is invalid for the given header.
         */
        InvalidJustification: PlainDescriptor<undefined>;
        /**
         * The authority set from the underlying header chain is invalid.
         */
        InvalidAuthoritySet: PlainDescriptor<undefined>;
        /**
         * The header being imported is older than the best finalized header known to the pallet.
         */
        OldHeader: PlainDescriptor<undefined>;
        /**
         * The scheduled authority set change found in the header is unsupported by the pallet.
         *
         * This is the case for non-standard (e.g forced) authority set changes.
         */
        UnsupportedScheduledChange: PlainDescriptor<undefined>;
        /**
         * The pallet is not yet initialized.
         */
        NotInitialized: PlainDescriptor<undefined>;
        /**
         * The pallet has already been initialized.
         */
        AlreadyInitialized: PlainDescriptor<undefined>;
        /**
         * Too many authorities in the set.
         */
        TooManyAuthoritiesInSet: PlainDescriptor<undefined>;
        /**
         * Error generated by the `OwnedBridgeModule` trait.
         */
        BridgeModule: PlainDescriptor<Anonymize<I8ih4atobnlo2v>>;
        /**
         * The `current_set_id` argument of the `submit_finality_proof_ex` doesn't match
         * the id of the current set, known to the pallet.
         */
        InvalidAuthoritySetId: PlainDescriptor<undefined>;
        /**
         * The submitter wanted free execution, but we can't fit more free transactions
         * to the block.
         */
        FreeHeadersLimitExceded: PlainDescriptor<undefined>;
        /**
         * The submitter wanted free execution, but the difference between best known and
         * bundled header numbers is below the `FreeHeadersInterval`.
         */
        BelowFreeHeaderInterval: PlainDescriptor<undefined>;
        /**
         * The header (and its finality) submission overflows hardcoded chain limits: size
         * and/or weight are larger than expected.
         */
        HeaderOverflowLimits: PlainDescriptor<undefined>;
    };
    BridgePolkadotParachains: {
        /**
         * Relay chain block hash is unknown to us.
         */
        UnknownRelayChainBlock: PlainDescriptor<undefined>;
        /**
         * The number of stored relay block is different from what the relayer has provided.
         */
        InvalidRelayChainBlockNumber: PlainDescriptor<undefined>;
        /**
         * Parachain heads storage proof is invalid.
         */
        HeaderChainStorageProof: PlainDescriptor<Anonymize<Ic2a7mmhqckbbo>>;
        /**
         * Error generated by the `OwnedBridgeModule` trait.
         */
        BridgeModule: PlainDescriptor<Anonymize<I8ih4atobnlo2v>>;
    };
    BridgePolkadotMessages: {
        /**
         * Pallet is not in Normal operating mode.
         */
        NotOperatingNormally: PlainDescriptor<undefined>;
        /**
         * Error that is reported by the lanes manager.
         */
        LanesManager: PlainDescriptor<Anonymize<I8ac87iu4gllf7>>;
        /**
         * Message has been treated as invalid by the pallet logic.
         */
        MessageRejectedByPallet: PlainDescriptor<Anonymize<I9l4i4j74aic6u>>;
        /**
         * The transaction brings too many messages.
         */
        TooManyMessagesInTheProof: PlainDescriptor<undefined>;
        /**
         * Invalid messages has been submitted.
         */
        InvalidMessagesProof: PlainDescriptor<undefined>;
        /**
         * Invalid messages delivery proof has been submitted.
         */
        InvalidMessagesDeliveryProof: PlainDescriptor<undefined>;
        /**
         * The relayer has declared invalid unrewarded relayers state in the
         * `receive_messages_delivery_proof` call.
         */
        InvalidUnrewardedRelayersState: PlainDescriptor<undefined>;
        /**
         * The cumulative dispatch weight, passed by relayer is not enough to cover dispatch
         * of all bundled messages.
         */
        InsufficientDispatchWeight: PlainDescriptor<undefined>;
        /**
         * Error confirming messages receival.
         */
        ReceptionConfirmation: PlainDescriptor<Anonymize<I6usvuval5ataj>>;
        /**
         * Error generated by the `OwnedBridgeModule` trait.
         */
        BridgeModule: PlainDescriptor<Anonymize<I8ih4atobnlo2v>>;
    };
    Sudo: {
        /**
         * Sender must be the Sudo account.
         */
        RequireSudo: PlainDescriptor<undefined>;
    };
    Proxy: {
        /**
         * There are too many proxies registered or too many announcements pending.
         */
        TooMany: PlainDescriptor<undefined>;
        /**
         * Proxy registration not found.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         * Sender is not a proxy of the account to be proxied.
         */
        NotProxy: PlainDescriptor<undefined>;
        /**
         * A call which is incompatible with the proxy type's filter was attempted.
         */
        Unproxyable: PlainDescriptor<undefined>;
        /**
         * Account is already a proxy.
         */
        Duplicate: PlainDescriptor<undefined>;
        /**
         * Call may not be made by proxy because it may escalate its privileges.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         * Announcement, if made at all, was made too recently.
         */
        Unannounced: PlainDescriptor<undefined>;
        /**
         * Cannot add self as proxy.
         */
        NoSelfProxy: PlainDescriptor<undefined>;
    };
};
type IConstants = {
    System: {
        /**
         * Block & extrinsics weights: base values and limits.
         */
        BlockWeights: PlainDescriptor<Anonymize<In7a38730s6qs>>;
        /**
         * The maximum length of a block (in bytes).
         */
        BlockLength: PlainDescriptor<Anonymize<If15el53dd76v9>>;
        /**
         * Maximum number of block number to block hash mappings to keep (oldest pruned first).
         */
        BlockHashCount: PlainDescriptor<number>;
        /**
         * The weight of runtime database operations the runtime can invoke.
         */
        DbWeight: PlainDescriptor<Anonymize<I9s0ave7t0vnrk>>;
        /**
         * Get the chain's in-code version.
         */
        Version: PlainDescriptor<Anonymize<I4fo08joqmcqnm>>;
        /**
         * The designated SS58 prefix of this chain.
         *
         * This replaces the "ss58Format" property declared in the chain spec. Reason is
         * that the runtime should know about the prefix in order to make use of it as
         * an identifier of the chain.
         */
        SS58Prefix: PlainDescriptor<number>;
    };
    Babe: {
        /**
         * The amount of time, in slots, that each epoch should last.
         * NOTE: Currently it is not possible to change the epoch duration after
         * the chain has started. Attempting to do so will brick block production.
         */
        EpochDuration: PlainDescriptor<bigint>;
        /**
         * The expected average block time at which BABE should be creating
         * blocks. Since BABE is probabilistic it is not trivial to figure out
         * what the expected average block time should be based on the slot
         * duration and the security parameter `c` (where `1 - c` represents
         * the probability of a slot being empty).
         */
        ExpectedBlockTime: PlainDescriptor<bigint>;
        /**
         * Max number of authorities allowed
         */
        MaxAuthorities: PlainDescriptor<number>;
        /**
         * The maximum number of nominators for each validator.
         */
        MaxNominators: PlainDescriptor<number>;
    };
    Timestamp: {
        /**
         * The minimum period between blocks.
         *
         * Be aware that this is different to the *expected* period that the block production
         * apparatus provides. Your chosen consensus system will generally work with this to
         * determine a sensible block time. For example, in the Aura pallet it will be double this
         * period on default settings.
         */
        MinimumPeriod: PlainDescriptor<bigint>;
    };
    ValidatorSet: {
        /**
         * Maximum number of validators.
         */
        MaxAuthorities: PlainDescriptor<number>;
        /**
         * Minimum number of blocks between [`set_keys`](pallet_session::Pallet::set_keys) calls
         * by a validator.
         */
        SetKeysCooldownBlocks: PlainDescriptor<number>;
    };
    Session: {
        /**
         * The amount to be held when setting keys.
         */
        KeyDeposit: PlainDescriptor<bigint>;
    };
    Grandpa: {
        /**
         * Max Authorities in use
         */
        MaxAuthorities: PlainDescriptor<number>;
        /**
         * The maximum number of nominators for each validator.
         */
        MaxNominators: PlainDescriptor<number>;
        /**
         * The maximum number of entries to keep in the set id to session index mapping.
         *
         * Since the `SetIdSession` map is only used for validating equivocations this
         * value should relate to the bonding duration of whatever staking system is
         * being used (if any). If equivocation handling is not enabled then this value
         * can be zero.
         */
        MaxSetIdSessionEntries: PlainDescriptor<bigint>;
    };
    TransactionStorage: {
        /**
         * Maximum number of indexed transactions in the block.
         */
        MaxBlockTransactions: PlainDescriptor<number>;
        /**
         * Maximum data set in a single transaction in bytes.
         */
        MaxTransactionSize: PlainDescriptor<number>;
        /**
         * Authorizations expire after this many blocks.
         */
        AuthorizationPeriod: PlainDescriptor<number>;
        /**
         * Priority of store/renew transactions.
         */
        StoreRenewPriority: PlainDescriptor<bigint>;
        /**
         * Longevity of store/renew transactions.
         */
        StoreRenewLongevity: PlainDescriptor<bigint>;
        /**
         * Priority of unsigned transactions to remove expired authorizations.
         */
        RemoveExpiredAuthorizationPriority: PlainDescriptor<bigint>;
        /**
         * Longevity of unsigned transactions to remove expired authorizations.
         */
        RemoveExpiredAuthorizationLongevity: PlainDescriptor<bigint>;
    };
    RelayerSet: {
        /**
         * Number of cooldown blocks after a bad bridge transaction signed by a relayer. The
         * relayer is blocked from submitting bridge transactions during the cooldown period.
         */
        BridgeTxFailCooldownBlocks: PlainDescriptor<number>;
    };
    BridgePolkadotGrandpa: {
        /**
         * Maximal number of "free" header transactions per block.
         *
         * To be able to track the bridged chain, the pallet requires all headers that are
         * changing GRANDPA authorities set at the bridged chain (we call them mandatory).
         * So it is a common good deed to submit mandatory headers to the pallet.
         *
         * The pallet may be configured (see `[Self::FreeHeadersInterval]`) to import some
         * non-mandatory headers for free as well. It also may be treated as a common good
         * deed, because it may help to reduce bridge fees - this cost may be deducted from
         * bridge fees, paid by message senders.
         *
         * However, if the bridged chain gets compromised, its validators may generate as many
         * "free" headers as they want. And they may fill the whole block (at this chain) for
         * free. This constant limits number of calls that we may refund in a single block.
         * All calls above this limit are accepted, but are not refunded.
         */
        MaxFreeHeadersPerBlock: PlainDescriptor<number>;
        /**
         * The distance between bridged chain headers, that may be submitted for free. The
         * first free header is header number zero, the next one is header number
         * `FreeHeadersInterval::get()` or any of its descendant if that header has not
         * been submitted. In other words, interval between free headers should be at least
         * `FreeHeadersInterval`.
         */
        FreeHeadersInterval: PlainDescriptor<Anonymize<I4arjljr6dpflb>>;
        /**
         * Maximal number of finalized headers to keep in the storage.
         *
         * The setting is there to prevent growing the on-chain state indefinitely. Note
         * the setting does not relate to block numbers - we will simply keep as much items
         * in the storage, so it doesn't guarantee any fixed timeframe for finality headers.
         *
         * Incautious change of this constant may lead to orphan entries in the runtime storage.
         */
        HeadersToKeep: PlainDescriptor<number>;
    };
    BridgePolkadotParachains: {
        /**
         * Name of the original `paras` pallet in the `construct_runtime!()` call at the bridged
         * chain.
         *
         * Please keep in mind that this should be the name of the `runtime_parachains::paras`
         * pallet from polkadot repository, not the `pallet-bridge-parachains`.
         */
        ParasPalletName: PlainDescriptor<string>;
        /**
         * Maximal number of single parachain heads to keep in the storage.
         *
         * The setting is there to prevent growing the on-chain state indefinitely. Note
         * the setting does not relate to parachain block numbers - we will simply keep as much
         * items in the storage, so it doesn't guarantee any fixed timeframe for heads.
         *
         * Incautious change of this constant may lead to orphan entries in the runtime storage.
         */
        HeadsToKeep: PlainDescriptor<number>;
        /**
         * Maximal size (in bytes) of the SCALE-encoded parachain head data
         * (`bp_parachains::ParaStoredHeaderData`).
         *
         * Keep in mind that the size of any tracked parachain header data must not exceed this
         * value. So if you're going to track multiple parachains, one of which is using large
         * hashes, you shall choose this maximal value.
         *
         * There's no mandatory headers in this pallet, so it can't stall if there's some header
         * that exceeds this bound.
         */
        MaxParaHeadDataSize: PlainDescriptor<number>;
    };
    Proxy: {
        /**
         * The base amount of currency needed to reserve for creating a proxy.
         *
         * This is held for an additional storage item whose value size is
         * `sizeof(Balance)` bytes and whose key size is `sizeof(AccountId)` bytes.
         */
        ProxyDepositBase: PlainDescriptor<bigint>;
        /**
         * The amount of currency needed per proxy added.
         *
         * This is held for adding 32 bytes plus an instance of `ProxyType` more into a
         * pre-existing storage value. Thus, when configuring `ProxyDepositFactor` one should take
         * into account `32 + proxy_type.encode().len()` bytes of data.
         */
        ProxyDepositFactor: PlainDescriptor<bigint>;
        /**
         * The maximum amount of proxies allowed for a single account.
         */
        MaxProxies: PlainDescriptor<number>;
        /**
         * The maximum amount of time-delayed announcements that are allowed to be pending.
         */
        MaxPending: PlainDescriptor<number>;
        /**
         * The base amount of currency needed to reserve for creating an announcement.
         *
         * This is held when a new storage item holding a `Balance` is created (typically 16
         * bytes).
         */
        AnnouncementDepositBase: PlainDescriptor<bigint>;
        /**
         * The amount of currency needed per announcement made.
         *
         * This is held for adding an `AccountId`, `Hash` and `BlockNumber` (typically 68 bytes)
         * into a pre-existing storage value.
         */
        AnnouncementDepositFactor: PlainDescriptor<bigint>;
    };
};
type IViewFns = {
    Proxy: {
        /**
         * Check if a `RuntimeCall` is allowed for a given `ProxyType`.
         */
        check_permissions: RuntimeDescriptor<[call: Anonymize<I6qd67h5q1e80s>, proxy_type: Anonymize<Icqldr8j4je7f4>], boolean>;
        /**
         * Check if one `ProxyType` is a subset of another `ProxyType`.
         */
        is_superset: RuntimeDescriptor<[to_check: Anonymize<Icqldr8j4je7f4>, against: Anonymize<Icqldr8j4je7f4>], boolean>;
    };
};
type IRuntimeCalls = {
    /**
     * The `Core` runtime api that every Substrate runtime needs to implement.
     */
    Core: {
        /**
         * Returns the version of the runtime.
         */
        version: RuntimeDescriptor<[], Anonymize<I4fo08joqmcqnm>>;
        /**
         * Execute the given block.
         */
        execute_block: RuntimeDescriptor<[block: Anonymize<Iaqet9jc3ihboe>], undefined>;
        /**
         * Initialize a block with the given header and return the runtime executive mode.
         */
        initialize_block: RuntimeDescriptor<[header: Anonymize<Ic952bubvq4k7d>], Anonymize<I2v50gu3s1aqk6>>;
    };
    /**
     * The `Metadata` api trait that returns metadata for the runtime.
     */
    Metadata: {
        /**
         * Returns the metadata of a runtime.
         */
        metadata: RuntimeDescriptor<[], Binary>;
        /**
         * Returns the metadata at a given version.
         *
         * If the given `version` isn't supported, this will return `None`.
         * Use [`Self::metadata_versions`] to find out about supported metadata version of the runtime.
         */
        metadata_at_version: RuntimeDescriptor<[version: number], Anonymize<Iabpgqcjikia83>>;
        /**
         * Returns the supported metadata versions.
         *
         * This can be used to call `metadata_at_version`.
         */
        metadata_versions: RuntimeDescriptor<[], Anonymize<Icgljjb6j82uhn>>;
    };
    /**
     * Runtime API for executing view functions
     */
    RuntimeViewFunction: {
        /**
         * Execute a view function query.
         */
        execute_view_function: RuntimeDescriptor<[query_id: Anonymize<I4gil44d08grh>, input: Binary], Anonymize<I7u915mvkdsb08>>;
    };
    /**
     * The `BlockBuilder` api trait that provides the required functionality for building a block.
     */
    BlockBuilder: {
        /**
         * Apply the given extrinsic.
         *
         * Returns an inclusion outcome which specifies if this extrinsic is included in
         * this block or not.
         */
        apply_extrinsic: RuntimeDescriptor<[extrinsic: Binary], Anonymize<Idumr6sfbu3l5m>>;
        /**
         * Finish the current block.
         */
        finalize_block: RuntimeDescriptor<[], Anonymize<Ic952bubvq4k7d>>;
        /**
         * Generate inherent extrinsics. The inherent data will vary from chain to chain.
         */
        inherent_extrinsics: RuntimeDescriptor<[inherent: Anonymize<If7uv525tdvv7a>], Anonymize<Itom7fk49o0c9>>;
        /**
         * Check that the inherents are valid. The inherent data will vary from chain to chain.
         */
        check_inherents: RuntimeDescriptor<[block: Anonymize<Iaqet9jc3ihboe>, data: Anonymize<If7uv525tdvv7a>], Anonymize<I2an1fs2eiebjp>>;
    };
    /**
     * The `TaggedTransactionQueue` api trait for interfering with the transaction queue.
     */
    TaggedTransactionQueue: {
        /**
         * Validate the transaction.
         *
         * This method is invoked by the transaction pool to learn details about given transaction.
         * The implementation should make sure to verify the correctness of the transaction
         * against current state. The given `block_hash` corresponds to the hash of the block
         * that is used as current state.
         *
         * Note that this call may be performed by the pool multiple times and transactions
         * might be verified in any possible order.
         */
        validate_transaction: RuntimeDescriptor<[source: TransactionValidityTransactionSource, tx: Binary, block_hash: FixedSizeBinary<32>], Anonymize<I9ask1o4tfvcvs>>;
    };
    /**
     * The offchain worker api.
     */
    OffchainWorkerApi: {
        /**
         * Starts the off-chain task for given block header.
         */
        offchain_worker: RuntimeDescriptor<[header: Anonymize<Ic952bubvq4k7d>], undefined>;
    };
    /**
     * Session keys runtime api.
     */
    SessionKeys: {
        /**
         * Generate a set of session keys with optionally using the given seed.
         * The keys should be stored within the keystore exposed via runtime
         * externalities.
         *
         * The seed needs to be a valid `utf8` string.
         *
         * Returns the concatenated SCALE encoded public keys.
         */
        generate_session_keys: RuntimeDescriptor<[owner: Binary, seed: Anonymize<Iabpgqcjikia83>], Anonymize<I4ph3d1eepnmr1>>;
        /**
         * Decode the given public session keys.
         *
         * Returns the list of public raw public keys + key type.
         */
        decode_session_keys: RuntimeDescriptor<[encoded: Binary], Anonymize<Icerf8h8pdu8ss>>;
    };
    /**
     * API necessary for block authorship with BABE.
     */
    BabeApi: {
        /**
         * Return the configuration for BABE.
         */
        configuration: RuntimeDescriptor<[], Anonymize<Iems84l8lk2v0c>>;
        /**
         * Returns the slot that started the current epoch.
         */
        current_epoch_start: RuntimeDescriptor<[], bigint>;
        /**
         * Returns information regarding the current epoch.
         */
        current_epoch: RuntimeDescriptor<[], Anonymize<I1r5ke30ueqo0r>>;
        /**
         * Returns information regarding the next epoch (which was already
         * previously announced).
         */
        next_epoch: RuntimeDescriptor<[], Anonymize<I1r5ke30ueqo0r>>;
        /**
         * Generates a proof of key ownership for the given authority in the
         * current epoch. An example usage of this module is coupled with the
         * session historical module to prove that a given authority key is
         * tied to a given staking identity during a specific session. Proofs
         * of key ownership are necessary for submitting equivocation reports.
         * NOTE: even though the API takes a `slot` as parameter the current
         * implementations ignores this parameter and instead relies on this
         * method being called at the correct block height, i.e. any point at
         * which the epoch for the given slot is live on-chain. Future
         * implementations will instead use indexed data through an offchain
         * worker, not requiring older states to be available.
         */
        generate_key_ownership_proof: RuntimeDescriptor<[slot: bigint, authority_id: FixedSizeBinary<32>], Anonymize<Iabpgqcjikia83>>;
        /**
         * Submits an unsigned extrinsic to report an equivocation. The caller
         * must provide the equivocation proof and a key ownership proof
         * (should be obtained using `generate_key_ownership_proof`). The
         * extrinsic will be unsigned and should only be accepted for local
         * authorship (not to be broadcast to the network). This method returns
         * `None` when creation of the extrinsic fails, e.g. if equivocation
         * reporting is disabled for the given runtime (i.e. this method is
         * hardcoded to return `None`). Only useful in an offchain context.
         */
        submit_report_equivocation_unsigned_extrinsic: RuntimeDescriptor<[equivocation_proof: Anonymize<I68ii5ik8avr9o>, key_owner_proof: Binary], boolean>;
    };
    /**
     * APIs for integrating the GRANDPA finality gadget into runtimes.
     * This should be implemented on the runtime side.
     *
     * This is primarily used for negotiating authority-set changes for the
     * gadget. GRANDPA uses a signaling model of changing authority sets:
     * changes should be signaled with a delay of N blocks, and then automatically
     * applied in the runtime after those N blocks have passed.
     *
     * The consensus protocol will coordinate the handoff externally.
     */
    GrandpaApi: {
        /**
         * Get the current GRANDPA authorities and weights. This should not change except
         * for when changes are scheduled and the corresponding delay has passed.
         *
         * When called at block B, it will return the set of authorities that should be
         * used to finalize descendants of this block (B+1, B+2, ...). The block B itself
         * is finalized by the authorities from block B-1.
         */
        grandpa_authorities: RuntimeDescriptor<[], Anonymize<I3geksg000c171>>;
        /**
         * Submits an unsigned extrinsic to report an equivocation. The caller
         * must provide the equivocation proof and a key ownership proof
         * (should be obtained using `generate_key_ownership_proof`). The
         * extrinsic will be unsigned and should only be accepted for local
         * authorship (not to be broadcast to the network). This method returns
         * `None` when creation of the extrinsic fails, e.g. if equivocation
         * reporting is disabled for the given runtime (i.e. this method is
         * hardcoded to return `None`). Only useful in an offchain context.
         */
        submit_report_equivocation_unsigned_extrinsic: RuntimeDescriptor<[equivocation_proof: Anonymize<I9puqgoda8ofk4>, key_owner_proof: Binary], boolean>;
        /**
         * Generates a proof of key ownership for the given authority in the
         * given set. An example usage of this module is coupled with the
         * session historical module to prove that a given authority key is
         * tied to a given staking identity during a specific session. Proofs
         * of key ownership are necessary for submitting equivocation reports.
         * NOTE: even though the API takes a `set_id` as parameter the current
         * implementations ignore this parameter and instead rely on this
         * method being called at the correct block height, i.e. any point at
         * which the given set id is live on-chain. Future implementations will
         * instead use indexed data through an offchain worker, not requiring
         * older states to be available.
         */
        generate_key_ownership_proof: RuntimeDescriptor<[set_id: bigint, authority_id: FixedSizeBinary<32>], Anonymize<Iabpgqcjikia83>>;
        /**
         * Get current GRANDPA authority set id.
         */
        current_set_id: RuntimeDescriptor<[], bigint>;
    };
    /**
     * The API to query account nonce.
     */
    AccountNonceApi: {
        /**
         * Get current account nonce of given `AccountId`.
         */
        account_nonce: RuntimeDescriptor<[account: SS58String], number>;
    };
    /**
     * API for querying information about the finalized chain headers.
     *
     * This API is implemented by runtimes that are receiving messages from this chain, not by this
     * chain's runtime itself.
     */
    PolkadotFinalityApi: {
        /**
         * Returns number and hash of the best finalized header known to the bridge module.
         */
        best_finalized: RuntimeDescriptor<[], Anonymize<I7gtb9g2qv4r10>>;
        /**
         * Returns free headers interval, if it is configured in the runtime.
         * The caller expects that if his transaction improves best known header
         * at least by the free_headers_interval`, it will be fee-free.
         *
         * See [`pallet_bridge_grandpa::Config::FreeHeadersInterval`] for details.
         */
        free_headers_interval: RuntimeDescriptor<[], Anonymize<I4arjljr6dpflb>>;
        /**
         * Returns the justifications accepted in the current block.
         */
        synced_headers_grandpa_info: RuntimeDescriptor<[], Anonymize<Ievrs91su783vi>>;
    };
    /**
     * API for querying information about the finalized chain headers.
     *
     * This API is implemented by runtimes that are receiving messages from this chain, not by this
     * chain's runtime itself.
     */
    PeoplePolkadotFinalityApi: {
        /**
         * Returns number and hash of the best finalized header known to the bridge module.
         */
        best_finalized: RuntimeDescriptor<[], Anonymize<I7gtb9g2qv4r10>>;
        /**
         * Returns free headers interval, if it is configured in the runtime.
         * The caller expects that if his transaction improves best known header
         * at least by the free_headers_interval`, it will be fee-free.
         *
         * See [`pallet_bridge_grandpa::Config::FreeHeadersInterval`] for details.
         */
        free_headers_interval: RuntimeDescriptor<[], Anonymize<I4arjljr6dpflb>>;
    };
    /**
     * Inbound message lane API for messages sent by this chain.
     *
     * This API is implemented by runtimes that are receiving messages from this chain, not by this
     * chain's runtime itself.
     *
     * Entries of the resulting vector are matching entries of the `messages` vector. Entries of the
     * `messages` vector may (and need to) be read using `To<ThisChain>OutboundLaneApi::message_details`.
     */
    FromPeoplePolkadotInboundLaneApi: {
        /**
         * Return details of given inbound messages.
         */
        message_details: RuntimeDescriptor<[lane: FixedSizeBinary<4>, messages: Anonymize<I3r3poh6h8vl7n>], Anonymize<I74b5o27m5tpv>>;
    };
    /**
     * Outbound message lane API for messages that are sent to this chain.
     *
     * This API is implemented by runtimes that are receiving messages from this chain, not by this
     * chain's runtime itself.
     */
    ToPeoplePolkadotOutboundLaneApi: {
        /**
         * Returns dispatch weight, encoded payload size and delivery+dispatch fee of all
         * messages in given inclusive range.
         *
         * If some (or all) messages are missing from the storage, they'll also will
         * be missing from the resulting vector. The vector is ordered by the nonce.
         */
        message_details: RuntimeDescriptor<[lane: FixedSizeBinary<4>, begin: bigint, end: bigint], Anonymize<I7uf2ofmdnm812>>;
    };
    /**
     * API to interact with `RuntimeGenesisConfig` for the runtime
     */
    GenesisBuilder: {
        /**
         * Build `RuntimeGenesisConfig` from a JSON blob not using any defaults and store it in the
         * storage.
         *
         * In the case of a FRAME-based runtime, this function deserializes the full
         * `RuntimeGenesisConfig` from the given JSON blob and puts it into the storage. If the
         * provided JSON blob is incorrect or incomplete or the deserialization fails, an error
         * is returned.
         *
         * Please note that provided JSON blob must contain all `RuntimeGenesisConfig` fields, no
         * defaults will be used.
         */
        build_state: RuntimeDescriptor<[json: Binary], Anonymize<Ie9sr1iqcg3cgm>>;
        /**
         * Returns a JSON blob representation of the built-in `RuntimeGenesisConfig` identified by
         * `id`.
         *
         * If `id` is `None` the function should return JSON blob representation of the default
         * `RuntimeGenesisConfig` struct of the runtime. Implementation must provide default
         * `RuntimeGenesisConfig`.
         *
         * Otherwise function returns a JSON representation of the built-in, named
         * `RuntimeGenesisConfig` preset identified by `id`, or `None` if such preset does not
         * exist. Returned `Vec<u8>` contains bytes of JSON blob (patch) which comprises a list of
         * (potentially nested) key-value pairs that are intended for customizing the default
         * runtime genesis config. The patch shall be merged (rfc7386) with the JSON representation
         * of the default `RuntimeGenesisConfig` to create a comprehensive genesis config that can
         * be used in `build_state` method.
         */
        get_preset: RuntimeDescriptor<[id: Anonymize<I1mqgk2tmnn9i2>], Anonymize<Iabpgqcjikia83>>;
        /**
         * Returns a list of identifiers for available builtin `RuntimeGenesisConfig` presets.
         *
         * The presets from the list can be queried with [`GenesisBuilder::get_preset`] method. If
         * no named presets are provided by the runtime the list is empty.
         */
        preset_names: RuntimeDescriptor<[], Anonymize<I6lr8sctk0bi4e>>;
    };
    /**
     * Runtime API trait for transaction storage support.
     */
    TransactionStorageApi: {
        /**
         * Get the actual value of a retention period in blocks.
         */
        retention_period: RuntimeDescriptor<[], number>;
    };
    /**
    
     */
    TransactionPaymentApi: {
        /**
        
         */
        query_info: RuntimeDescriptor<[uxt: Binary, len: number], Anonymize<I6spmpef2c7svf>>;
        /**
        
         */
        query_fee_details: RuntimeDescriptor<[uxt: Binary, len: number], Anonymize<Iei2mvq0mjvt81>>;
        /**
        
         */
        query_weight_to_fee: RuntimeDescriptor<[weight: Anonymize<I4q39t5hn830vp>], bigint>;
        /**
        
         */
        query_length_to_fee: RuntimeDescriptor<[length: number], bigint>;
    };
};
export type BulletinDispatchError = Anonymize<If2t8tp4q6th5>;
type IAsset = PlainDescriptor<void>;
export type BulletinExtensions = {
    "ProvideCidConfig": {
        value: Anonymize<Ideol201iiphm6>;
    };
};
type PalletsTypedef = {
    __storage: IStorage;
    __tx: ICalls;
    __event: IEvent;
    __error: IError;
    __const: IConstants;
    __view: IViewFns;
};
export type Bulletin = {
    descriptors: {
        pallets: PalletsTypedef;
        apis: IRuntimeCalls;
    } & Promise<any>;
    metadataTypes: Promise<Uint8Array>;
    asset: IAsset;
    extensions: BulletinExtensions;
    getMetadata: () => Promise<Uint8Array>;
    genesis: string | undefined;
};
declare const _allDescriptors: Bulletin;
export default _allDescriptors;
export type BulletinApis = ApisFromDef<IRuntimeCalls>;
export type BulletinQueries = QueryFromPalletsDef<PalletsTypedef>;
export type BulletinCalls = TxFromPalletsDef<PalletsTypedef>;
export type BulletinEvents = EventsFromPalletsDef<PalletsTypedef>;
export type BulletinErrors = ErrorsFromPalletsDef<PalletsTypedef>;
export type BulletinConstants = ConstFromPalletsDef<PalletsTypedef>;
export type BulletinViewFns = ViewFnsFromPalletsDef<PalletsTypedef>;
export type BulletinCallData = Anonymize<I6qd67h5q1e80s> & {
    value: {
        type: string;
    };
};
type AllInteractions = {
    storage: {
        System: ['Account', 'ExtrinsicCount', 'InherentsApplied', 'BlockWeight', 'AllExtrinsicsLen', 'BlockHash', 'ExtrinsicData', 'Number', 'ParentHash', 'Digest', 'Events', 'EventCount', 'EventTopics', 'LastRuntimeUpgrade', 'UpgradedToU32RefCount', 'UpgradedToTripleRefCount', 'ExecutionPhase', 'AuthorizedUpgrade', 'ExtrinsicWeightReclaimed'];
        Babe: ['EpochIndex', 'Authorities', 'GenesisSlot', 'CurrentSlot', 'Randomness', 'PendingEpochConfigChange', 'NextRandomness', 'NextAuthorities', 'SegmentIndex', 'UnderConstruction', 'Initialized', 'AuthorVrfRandomness', 'EpochStart', 'Lateness', 'EpochConfig', 'NextEpochConfig', 'SkippedEpochs'];
        Timestamp: ['Now', 'DidUpdate'];
        Authorship: ['Author'];
        Offences: ['Reports', 'ConcurrentReportsIndex'];
        Historical: ['HistoricalSessions', 'StoredRange'];
        ValidatorSet: ['Validators', 'NumValidators', 'NextDisabledValidators'];
        Session: ['Validators', 'CurrentIndex', 'QueuedChanged', 'QueuedKeys', 'DisabledValidators', 'NextKeys', 'KeyOwner'];
        Grandpa: ['State', 'PendingChange', 'NextForced', 'Stalled', 'CurrentSetId', 'SetIdSession', 'Authorities'];
        TransactionStorage: ['Authorizations', 'Transactions', 'ByteFee', 'EntryFee', 'RetentionPeriod', 'BlockTransactions', 'ProofChecked', 'CidConfigForStore'];
        RelayerSet: ['Relayers'];
        BridgePolkadotGrandpa: ['FreeHeadersRemaining', 'InitialHash', 'BestFinalized', 'ImportedHashes', 'ImportedHashesPointer', 'ImportedHeaders', 'CurrentAuthoritySet', 'PalletOwner', 'PalletOperatingMode'];
        BridgePolkadotParachains: ['PalletOwner', 'PalletOperatingMode', 'ParasInfo', 'ImportedParaHeads', 'ImportedParaHashes'];
        BridgePolkadotMessages: ['PalletOwner', 'PalletOperatingMode', 'InboundLanes', 'OutboundLanes', 'OutboundMessages'];
        Sudo: ['Key'];
        Proxy: ['Proxies', 'Announcements'];
    };
    tx: {
        System: ['remark', 'set_heap_pages', 'set_code', 'set_code_without_checks', 'set_storage', 'kill_storage', 'kill_prefix', 'remark_with_event', 'authorize_upgrade', 'authorize_upgrade_without_checks', 'apply_authorized_upgrade'];
        Babe: ['report_equivocation', 'report_equivocation_unsigned', 'plan_config_change'];
        Timestamp: ['set'];
        ValidatorSet: ['add_validator', 'remove_validator'];
        Session: ['set_keys', 'purge_keys'];
        Grandpa: ['report_equivocation', 'report_equivocation_unsigned', 'note_stalled'];
        TransactionStorage: ['store', 'renew', 'check_proof', 'authorize_account', 'authorize_preimage', 'remove_expired_account_authorization', 'remove_expired_preimage_authorization', 'refresh_account_authorization', 'refresh_preimage_authorization'];
        RelayerSet: ['add_relayer', 'remove_relayer'];
        BridgePolkadotGrandpa: ['submit_finality_proof', 'initialize', 'set_owner', 'set_operating_mode', 'submit_finality_proof_ex', 'force_set_pallet_state'];
        BridgePolkadotParachains: ['submit_parachain_heads', 'set_owner', 'set_operating_mode', 'submit_parachain_heads_ex'];
        BridgePolkadotMessages: ['set_owner', 'set_operating_mode', 'receive_messages_proof', 'receive_messages_delivery_proof'];
        Sudo: ['sudo', 'sudo_unchecked_weight', 'set_key', 'sudo_as', 'remove_key'];
        Proxy: ['proxy', 'add_proxy', 'remove_proxy', 'remove_proxies', 'create_pure', 'kill_pure', 'announce', 'remove_announcement', 'reject_announcement', 'proxy_announced', 'poke_deposit'];
    };
    events: {
        System: ['ExtrinsicSuccess', 'ExtrinsicFailed', 'CodeUpdated', 'NewAccount', 'KilledAccount', 'Remarked', 'UpgradeAuthorized', 'RejectedInvalidAuthorizedUpgrade'];
        Offences: ['Offence'];
        Historical: ['RootStored', 'RootsPruned'];
        ValidatorSet: ['ValidatorAdded', 'ValidatorRemoved'];
        Session: ['NewSession', 'NewQueued', 'ValidatorDisabled', 'ValidatorReenabled'];
        Grandpa: ['NewAuthorities', 'Paused', 'Resumed'];
        TransactionStorage: ['Stored', 'Renewed', 'ProofChecked', 'AccountAuthorized', 'AccountAuthorizationRefreshed', 'PreimageAuthorized', 'PreimageAuthorizationRefreshed', 'ExpiredAccountAuthorizationRemoved', 'ExpiredPreimageAuthorizationRemoved'];
        RelayerSet: ['RelayerAdded', 'RelayerRemoved'];
        BridgePolkadotGrandpa: ['UpdatedBestFinalizedHeader'];
        BridgePolkadotParachains: ['UntrackedParachainRejected', 'MissingParachainHead', 'IncorrectParachainHeadHash', 'RejectedObsoleteParachainHead', 'RejectedLargeParachainHead', 'UpdatedParachainHead'];
        BridgePolkadotMessages: ['MessageAccepted', 'MessagesReceived', 'MessagesDelivered'];
        Sudo: ['Sudid', 'KeyChanged', 'KeyRemoved', 'SudoAsDone'];
        Proxy: ['ProxyExecuted', 'PureCreated', 'PureKilled', 'Announced', 'ProxyAdded', 'ProxyRemoved', 'DepositPoked'];
    };
    errors: {
        System: ['InvalidSpecName', 'SpecVersionNeedsToIncrease', 'FailedToExtractRuntimeVersion', 'NonDefaultComposite', 'NonZeroRefCount', 'CallFiltered', 'MultiBlockMigrationsOngoing', 'NothingAuthorized', 'Unauthorized'];
        Babe: ['InvalidEquivocationProof', 'InvalidKeyOwnershipProof', 'DuplicateOffenceReport', 'InvalidConfiguration'];
        ValidatorSet: ['Duplicate', 'NotAValidator', 'TooManyValidators'];
        Session: ['InvalidProof', 'NoAssociatedValidatorId', 'DuplicatedKey', 'NoKeys', 'NoAccount'];
        Grandpa: ['PauseFailed', 'ResumeFailed', 'ChangePending', 'TooSoon', 'InvalidKeyOwnershipProof', 'InvalidEquivocationProof', 'DuplicateOffenceReport'];
        TransactionStorage: ['BadContext', 'BadDataSize', 'TooManyTransactions', 'NotConfigured', 'RenewedNotFound', 'UnexpectedProof', 'InvalidProof', 'MissingProof', 'MissingStateData', 'DoubleCheck', 'ProofNotChecked', 'AuthorizationNotFound', 'AuthorizationNotExpired', 'InvalidContentHash'];
        RelayerSet: ['Duplicate', 'NotARelayer'];
        BridgePolkadotGrandpa: ['InvalidJustification', 'InvalidAuthoritySet', 'OldHeader', 'UnsupportedScheduledChange', 'NotInitialized', 'AlreadyInitialized', 'TooManyAuthoritiesInSet', 'BridgeModule', 'InvalidAuthoritySetId', 'FreeHeadersLimitExceded', 'BelowFreeHeaderInterval', 'HeaderOverflowLimits'];
        BridgePolkadotParachains: ['UnknownRelayChainBlock', 'InvalidRelayChainBlockNumber', 'HeaderChainStorageProof', 'BridgeModule'];
        BridgePolkadotMessages: ['NotOperatingNormally', 'LanesManager', 'MessageRejectedByPallet', 'TooManyMessagesInTheProof', 'InvalidMessagesProof', 'InvalidMessagesDeliveryProof', 'InvalidUnrewardedRelayersState', 'InsufficientDispatchWeight', 'ReceptionConfirmation', 'BridgeModule'];
        Sudo: ['RequireSudo'];
        Proxy: ['TooMany', 'NotFound', 'NotProxy', 'Unproxyable', 'Duplicate', 'NoPermission', 'Unannounced', 'NoSelfProxy'];
    };
    constants: {
        System: ['BlockWeights', 'BlockLength', 'BlockHashCount', 'DbWeight', 'Version', 'SS58Prefix'];
        Babe: ['EpochDuration', 'ExpectedBlockTime', 'MaxAuthorities', 'MaxNominators'];
        Timestamp: ['MinimumPeriod'];
        ValidatorSet: ['MaxAuthorities', 'SetKeysCooldownBlocks'];
        Session: ['KeyDeposit'];
        Grandpa: ['MaxAuthorities', 'MaxNominators', 'MaxSetIdSessionEntries'];
        TransactionStorage: ['MaxBlockTransactions', 'MaxTransactionSize', 'AuthorizationPeriod', 'StoreRenewPriority', 'StoreRenewLongevity', 'RemoveExpiredAuthorizationPriority', 'RemoveExpiredAuthorizationLongevity'];
        RelayerSet: ['BridgeTxFailCooldownBlocks'];
        BridgePolkadotGrandpa: ['MaxFreeHeadersPerBlock', 'FreeHeadersInterval', 'HeadersToKeep'];
        BridgePolkadotParachains: ['ParasPalletName', 'HeadsToKeep', 'MaxParaHeadDataSize'];
        Proxy: ['ProxyDepositBase', 'ProxyDepositFactor', 'MaxProxies', 'MaxPending', 'AnnouncementDepositBase', 'AnnouncementDepositFactor'];
    };
    viewFns: {
        Proxy: ['check_permissions', 'is_superset'];
    };
    apis: {
        Core: ['version', 'execute_block', 'initialize_block'];
        Metadata: ['metadata', 'metadata_at_version', 'metadata_versions'];
        RuntimeViewFunction: ['execute_view_function'];
        BlockBuilder: ['apply_extrinsic', 'finalize_block', 'inherent_extrinsics', 'check_inherents'];
        TaggedTransactionQueue: ['validate_transaction'];
        OffchainWorkerApi: ['offchain_worker'];
        SessionKeys: ['generate_session_keys', 'decode_session_keys'];
        BabeApi: ['configuration', 'current_epoch_start', 'current_epoch', 'next_epoch', 'generate_key_ownership_proof', 'submit_report_equivocation_unsigned_extrinsic'];
        GrandpaApi: ['grandpa_authorities', 'submit_report_equivocation_unsigned_extrinsic', 'generate_key_ownership_proof', 'current_set_id'];
        AccountNonceApi: ['account_nonce'];
        PolkadotFinalityApi: ['best_finalized', 'free_headers_interval', 'synced_headers_grandpa_info'];
        PeoplePolkadotFinalityApi: ['best_finalized', 'free_headers_interval'];
        FromPeoplePolkadotInboundLaneApi: ['message_details'];
        ToPeoplePolkadotOutboundLaneApi: ['message_details'];
        GenesisBuilder: ['build_state', 'get_preset', 'preset_names'];
        TransactionStorageApi: ['retention_period'];
        TransactionPaymentApi: ['query_info', 'query_fee_details', 'query_weight_to_fee', 'query_length_to_fee'];
    };
};
export type BulletinWhitelistEntry = PalletKey | `query.${NestedKey<AllInteractions['storage']>}` | `tx.${NestedKey<AllInteractions['tx']>}` | `event.${NestedKey<AllInteractions['events']>}` | `error.${NestedKey<AllInteractions['errors']>}` | `const.${NestedKey<AllInteractions['constants']>}` | `view.${NestedKey<AllInteractions['viewFns']>}` | `api.${NestedKey<AllInteractions['apis']>}`;
type PalletKey = `*.${({
    [K in keyof AllInteractions]: K extends 'apis' ? never : keyof AllInteractions[K];
})[keyof AllInteractions]}`;
type NestedKey<D extends Record<string, string[]>> = "*" | {
    [P in keyof D & string]: `${P}.*` | `${P}.${D[P][number]}`;
}[keyof D & string];
