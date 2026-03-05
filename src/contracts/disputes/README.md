# Disputes (`@polkadot/disputes`)

Decentralized dispute resolution contract with collective voting. Context owners (apps) register dispute types up front, then submit individual cases that community voters resolve through consensus.

## Dependencies

- `@polkadot/contexts` — used via CDM to verify the caller owns the context
- `common::math::RunningAverage` — vote tallying

## Core Concepts

### Instructions (per-context dispute types)

At setup time, a context owner registers **instructions** — a catalog of dispute types their app supports. Each instruction has:
- `metadata_uri` — describes what voters are deciding (e.g., "What % of escrow should the client receive?")
- `voting_rule_id` — which voting rule applies (`0` = Binary, `1` = Range)

For example, a gig marketplace might register:
- Instruction 0: "Was the work delivered?" (Binary)
- Instruction 1: "How should the escrow be split?" (Range)
- Instruction 2: "Was the deadline met?" (Binary)

### Voting Rules

| ID | Name | Voter Input | Decision Logic |
|----|------|------------|----------------|
| `0` | Binary | `0` or `1` | Majority wins. Internally maps `1→255`, `0→0` in RunningAverage. Decision = `avg >= 128 → 1, else 0`. Ties favor defendant (0). |
| `1` | Range | `0`–`255` | Average of all votes. E.g., 0 = worker gets all, 255 = client gets all. |

### Disputes (cases)

When opening a dispute, the context owner specifies which instruction (by index) applies. Each dispute gets one instruction, one tally, and one decision.

### Lifecycle

```
Open (0) → [counter-evidence] → Countered (1) → [begin_voting] → Voting (2) → [4 votes] → Resolved (3)
```

- Counter-evidence is optional — `begin_voting` works from status 0 or 1
- After 4 unique voters (`REQUIRED_VOTES = 4`), auto-resolves
- Context owner can admin-override with `provide_judgment` at any pre-resolved status
- Voters can update their vote before resolution (swaps old value in the tally)

## Status Codes

| Code | Meaning |
|------|---------|
| `0` | Open |
| `1` | Countered (counter-evidence submitted) |
| `2` | Voting |
| `3` | Resolved |
| `255` | Not found (query sentinel from `get_dispute_status`) |

## Storage

| Key | Value | Description |
|-----|-------|-------------|
| `(ContextId, u32)` | `Instruction` | Per-context instruction catalog |
| `ContextId` | `u32` | Instruction count per context |
| `(ContextId, EntityId)` | `Dispute` | Dispute data |
| `(ContextId, EntityId)` | `RunningAverage` | Vote tally per dispute |
| `(ContextId, EntityId, Address)` | `bool` | Whether an address has voted on a dispute |
| `(ContextId, EntityId, Address)` | `u8` | Voter's mapped value (for vote updates) |
| `(ContextId, EntityId)` | `u8` | Final decision (written on resolution) |

## Methods

### Instructions Management (Context Owner)

#### `add_instruction(context_id, metadata_uri, voting_rule_id)`
Append a new dispute type to the context's instruction catalog. `voting_rule_id` must be `0` (Binary) or `1` (Range).

#### `get_instruction_count(context_id) -> u32`
Returns the number of registered instructions for a context.

#### `get_instruction(context_id, index) -> InstructionInfo`
Returns the metadata URI and voting rule for an instruction. Reverts if index is out of bounds.

### Dispute Lifecycle (Context Owner)

#### `open_dispute(context_id, dispute_id, claimant, against, claim_uri, instruction_index)`
Opens a new dispute referencing an instruction from the context's catalog. Reverts if instruction doesn't exist or dispute ID is already taken.

#### `submit_counter_evidence(context_id, dispute_id, counter_claim_uri)`
Attaches counter-evidence to an open dispute (status 0 → 1).

#### `begin_voting(context_id, dispute_id)`
Transitions a dispute to voting phase (status 0|1 → 2).

#### `provide_judgment(context_id, dispute_id, decision, resolution_uri)`
Admin override — directly resolves any pre-resolved dispute (status → 3). Writes the decision value and resolution URI.

### Voting (Anyone)

#### `cast_vote(context_id, dispute_id, value)`
Submit or update a vote on a dispute in voting phase. The value is interpreted based on the dispute's instruction:
- **Binary**: `0` or `1` (mapped internally to `0`/`255` for averaging)
- **Range**: `0`–`255` used as-is

One vote per address per dispute. Re-calling updates the previous vote (swaps old → new in the tally without changing vote count). Auto-resolves when `vote_count` reaches 4.

### Queries (Anyone)

#### `get_dispute_status(context_id, dispute_id) -> u8`
Returns the status code, or `255` if not found. Backward compatible.

#### `get_decision(context_id, dispute_id) -> u8`
Returns the decision value for a resolved dispute (0 if unresolved or not found).

#### `get_vote_count(context_id, dispute_id) -> u32`
Returns the number of unique voters on a dispute.

#### `get_dispute_info(context_id, dispute_id) -> DisputeInfo`
Returns status, vote count, claimant address, against entity, and instruction index. Reverts if not found.

### Cleanup (Context Owner)

#### `delete_dispute(context_id, dispute_id)`
Removes a dispute from storage. Only allowed for open (0) or resolved (3) disputes.
