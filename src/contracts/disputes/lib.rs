#![no_main]
#![no_std]

use alloc::string::String;
use common::{ContextId, EntityId, math, revert};
use pvm::storage::Mapping;
use pvm::{Address, caller};
use pvm_contract as pvm;

use parity_scale_codec::{Decode, Encode};

const REQUIRED_VOTES: u32 = 4;
const RULE_BINARY: u8 = 0;
const RULE_RANGE: u8 = 1;

#[derive(Clone, Encode, Decode)]
pub struct Dispute {
    pub id: EntityId,
    pub claimant: Address,
    pub against: EntityId,
    pub claim_uri: String,
    pub counter_claim_uri: String,
    pub status: u8,
    pub resolution_uri: String,
    pub vote_count: u32,
    pub instruction_index: u32,
}

#[derive(Clone, Encode, Decode)]
pub struct Instruction {
    pub metadata_uri: String,
    pub voting_rule_id: u8,
}

#[derive(pvm::SolAbi)]
pub struct DisputeInfo {
    pub status: u8,
    pub vote_count: u32,
    pub claimant: Address,
    pub against: EntityId,
    pub instruction_index: u32,
}

#[derive(pvm::SolAbi)]
pub struct InstructionInfo {
    pub metadata_uri: String,
    pub voting_rule_id: u8,
}

#[derive(pvm::SolAbi)]
pub struct DisputeRef {
    pub context_id: ContextId,
    pub dispute_id: EntityId,
}

#[pvm::storage]
struct Storage {
    context_registry: contexts::Reference,

    // Instructions — per-context catalog of dispute types
    instruction_count: Mapping<ContextId, u32>,
    instruction_items: Mapping<(ContextId, u32), Instruction>,

    // Disputes — each references one instruction by index
    disputes: Mapping<(ContextId, EntityId), Dispute>,

    // Global dispute index (flat, across all contexts)
    total_dispute_count: u32,
    dispute_at: Mapping<u32, (ContextId, EntityId)>,

    // Voting — one tally per dispute, one stored value per voter per dispute
    tallies: Mapping<(ContextId, EntityId), math::RunningAverage>,
    has_voted: Mapping<(ContextId, EntityId, Address), bool>,
    voter_values: Mapping<(ContextId, EntityId, Address), u8>,

    // Decision (written on resolution)
    decisions: Mapping<(ContextId, EntityId), u8>,
}

fn require_context_owner(context_id: ContextId) {
    let ctx_reg = match Storage::context_registry().get() {
        Some(r) => r,
        None => revert(b"NotInitialized"),
    };
    let is_owner = match ctx_reg.is_owner(context_id, caller()) {
        Ok(v) => v,
        Err(_) => revert(b"ContextsCallFailed"),
    };
    if !is_owner {
        revert(b"Unauthorized");
    }
}

fn load_dispute(context_id: ContextId, dispute_id: EntityId) -> Dispute {
    match Storage::disputes().get(&(context_id, dispute_id)) {
        Some(d) => d,
        None => revert(b"DisputeNotFound"),
    }
}

fn load_instruction(context_id: ContextId, index: u32) -> Instruction {
    match Storage::instruction_items().get(&(context_id, index)) {
        Some(i) => i,
        None => revert(b"InstructionNotFound"),
    }
}

fn map_vote(voting_rule_id: u8, val: u8) -> u8 {
    match voting_rule_id {
        RULE_BINARY => {
            if val > 1 {
                revert(b"BinaryVoteMustBe0Or1");
            }
            if val == 1 { 255u8 } else { 0u8 }
        }
        RULE_RANGE => val,
        _ => revert(b"InvalidVotingRule"),
    }
}

fn compute_decision(voting_rule_id: u8, tally: &math::RunningAverage) -> u8 {
    match voting_rule_id {
        RULE_BINARY => {
            if tally.val() >= 128 {
                1
            } else {
                0
            }
        }
        RULE_RANGE => tally.val(),
        _ => 0,
    }
}

#[pvm::contract(cdm = "@polkadot/disputes")]
mod disputes {
    use super::*;

    #[pvm::constructor]
    pub fn new() -> Result<(), Error> {
        let ctx_reg = contexts::cdm_reference();
        Storage::context_registry().set(&ctx_reg);
        Ok(())
    }

    // ── Instructions Management (Context Owner) ──────────────────────

    #[pvm::method]
    pub fn add_instruction(context_id: ContextId, metadata_uri: String, voting_rule_id: u8) {
        require_context_owner(context_id);

        if voting_rule_id != RULE_BINARY && voting_rule_id != RULE_RANGE {
            revert(b"InvalidVotingRule");
        }

        let count = Storage::instruction_count().get(&context_id).unwrap_or(0);

        Storage::instruction_items().insert(
            &(context_id, count),
            &Instruction {
                metadata_uri,
                voting_rule_id,
            },
        );
        Storage::instruction_count().insert(&context_id, &(count + 1));
    }

    #[pvm::method]
    pub fn get_instruction_count(context_id: ContextId) -> u32 {
        Storage::instruction_count().get(&context_id).unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_instruction(context_id: ContextId, index: u32) -> InstructionInfo {
        let instr = load_instruction(context_id, index);
        InstructionInfo {
            metadata_uri: instr.metadata_uri,
            voting_rule_id: instr.voting_rule_id,
        }
    }

    // ── Dispute Lifecycle (Context Owner) ────────────────────────────

    #[pvm::method]
    pub fn open_dispute(
        context_id: ContextId,
        dispute_id: EntityId,
        claimant: Address,
        against: EntityId,
        claim_uri: String,
        instruction_index: u32,
    ) {
        require_context_owner(context_id);

        // Verify the instruction exists
        let count = Storage::instruction_count().get(&context_id).unwrap_or(0);
        if instruction_index >= count {
            revert(b"InstructionNotFound");
        }

        if Storage::disputes().contains(&(context_id, dispute_id)) {
            revert(b"DisputeAlreadyExists");
        }

        let dispute = Dispute {
            id: dispute_id,
            claimant,
            against,
            claim_uri,
            counter_claim_uri: String::new(),
            status: 0,
            resolution_uri: String::new(),
            vote_count: 0,
            instruction_index,
        };

        Storage::disputes().insert(&(context_id, dispute_id), &dispute);

        // Append to global index
        let idx = Storage::total_dispute_count().get().unwrap_or(0);
        Storage::dispute_at().insert(&idx, &(context_id, dispute_id));
        Storage::total_dispute_count().set(&(idx + 1));
    }

    #[pvm::method]
    pub fn submit_counter_evidence(
        context_id: ContextId,
        dispute_id: EntityId,
        counter_claim_uri: String,
    ) {
        require_context_owner(context_id);

        let mut dispute = load_dispute(context_id, dispute_id);
        if dispute.status != 0 {
            revert(b"DisputeNotOpen");
        }

        dispute.counter_claim_uri = counter_claim_uri;
        dispute.status = 1;
        Storage::disputes().insert(&(context_id, dispute_id), &dispute);
    }

    #[pvm::method]
    pub fn begin_voting(context_id: ContextId, dispute_id: EntityId) {
        require_context_owner(context_id);

        let mut dispute = load_dispute(context_id, dispute_id);
        if dispute.status > 1 {
            revert(b"InvalidStatusForVoting");
        }

        dispute.status = 2;
        Storage::disputes().insert(&(context_id, dispute_id), &dispute);
    }

    #[pvm::method]
    pub fn provide_judgment(
        context_id: ContextId,
        dispute_id: EntityId,
        decision: u8,
        resolution_uri: String,
    ) {
        require_context_owner(context_id);

        let mut dispute = load_dispute(context_id, dispute_id);
        if dispute.status >= 3 {
            revert(b"DisputeAlreadyResolved");
        }

        Storage::decisions().insert(&(context_id, dispute_id), &decision);
        dispute.status = 3;
        dispute.resolution_uri = resolution_uri;
        Storage::disputes().insert(&(context_id, dispute_id), &dispute);
    }

    // ── Voting (Anyone) ─────────────────────────────────────────────

    #[pvm::method]
    pub fn cast_vote(context_id: ContextId, dispute_id: EntityId, value: u8) {
        let mut dispute = load_dispute(context_id, dispute_id);
        if dispute.status != 2 {
            revert(b"DisputeNotInVoting");
        }

        let voter = caller();
        let is_update = Storage::has_voted()
            .get(&(context_id, dispute_id, voter))
            .unwrap_or(false);

        let instr = load_instruction(context_id, dispute.instruction_index);
        let mapped = map_vote(instr.voting_rule_id, value);

        let prev = if is_update {
            Storage::voter_values().get(&(context_id, dispute_id, voter))
        } else {
            None
        };

        let mut tally = Storage::tallies()
            .get(&(context_id, dispute_id))
            .unwrap_or_default();
        tally.update(prev, Some(mapped));
        Storage::tallies().insert(&(context_id, dispute_id), &tally);
        Storage::voter_values().insert(&(context_id, dispute_id, voter), &mapped);

        if !is_update {
            Storage::has_voted().insert(&(context_id, dispute_id, voter), &true);
            dispute.vote_count += 1;
        }

        if dispute.vote_count >= REQUIRED_VOTES {
            let decision = compute_decision(instr.voting_rule_id, &tally);
            Storage::decisions().insert(&(context_id, dispute_id), &decision);
            dispute.status = 3;
        }

        Storage::disputes().insert(&(context_id, dispute_id), &dispute);
    }

    // ── Queries (Anyone) ─────────────────────────────────────────────

    #[pvm::method]
    pub fn get_dispute_status(context_id: ContextId, dispute_id: EntityId) -> u8 {
        Storage::disputes()
            .get(&(context_id, dispute_id))
            .map(|d| d.status)
            .unwrap_or(255)
    }

    #[pvm::method]
    pub fn get_decision(context_id: ContextId, dispute_id: EntityId) -> u8 {
        Storage::decisions()
            .get(&(context_id, dispute_id))
            .unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_vote_count(context_id: ContextId, dispute_id: EntityId) -> u32 {
        Storage::disputes()
            .get(&(context_id, dispute_id))
            .map(|d| d.vote_count)
            .unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_dispute_info(context_id: ContextId, dispute_id: EntityId) -> DisputeInfo {
        match Storage::disputes().get(&(context_id, dispute_id)) {
            Some(d) => DisputeInfo {
                status: d.status,
                vote_count: d.vote_count,
                claimant: d.claimant,
                against: d.against,
                instruction_index: d.instruction_index,
            },
            None => revert(b"DisputeNotFound"),
        }
    }

    // ── Global Enumeration (Anyone) ─────────────────────────────────

    #[pvm::method]
    pub fn get_total_dispute_count() -> u32 {
        Storage::total_dispute_count().get().unwrap_or(0)
    }

    #[pvm::method]
    pub fn get_dispute_at(index: u32) -> DisputeRef {
        match Storage::dispute_at().get(&index) {
            Some((context_id, dispute_id)) => DisputeRef {
                context_id,
                dispute_id,
            },
            None => revert(b"IndexOutOfBounds"),
        }
    }

    // ── Cleanup (Context Owner) ──────────────────────────────────────

    #[pvm::method]
    pub fn delete_dispute(context_id: ContextId, dispute_id: EntityId) {
        require_context_owner(context_id);

        let dispute = load_dispute(context_id, dispute_id);
        if dispute.status != 0 && dispute.status != 3 {
            revert(b"CanOnlyDeleteOpenOrResolved");
        }

        Storage::disputes().remove(&(context_id, dispute_id));
    }
}
