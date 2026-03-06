import type { InkDescriptors } from 'polkadot-api/ink';
import type { HexString, Enum, Binary } from 'polkadot-api';
type Address = HexString;
type StorageDescriptor = {};
type MessagesDescriptor = {
    "addInstruction": {
        message: {
            "context_id": Binary;
            "metadata_uri": string;
            "voting_rule_id": number;
        };
        response: {};
    };
    "getInstructionCount": {
        message: {
            "context_id": Binary;
        };
        response: number;
    };
    "getInstruction": {
        message: {
            "context_id": Binary;
            "index": number;
        };
        response: {
            "metadata_uri": string;
            "voting_rule_id": number;
        };
    };
    "openDispute": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
            "claimant": Address;
            "against": Binary;
            "claim_uri": string;
            "instruction_index": number;
        };
        response: {};
    };
    "submitCounterEvidence": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
            "counter_claim_uri": string;
        };
        response: {};
    };
    "beginVoting": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
        response: {};
    };
    "provideJudgment": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
            "decision": number;
            "resolution_uri": string;
        };
        response: {};
    };
    "castVote": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
            "value": number;
        };
        response: {};
    };
    "getDisputeStatus": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
        response: number;
    };
    "getDecision": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
        response: number;
    };
    "getVoteCount": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
        response: number;
    };
    "getDisputeInfo": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
        response: {
            "status": number;
            "vote_count": number;
            "claimant": Address;
            "against": Binary;
            "instruction_index": number;
            "claim_uri": string;
            "counter_claim_uri": string;
            "resolution_uri": string;
        };
    };
    "getTotalDisputeCount": {
        message: {};
        response: number;
    };
    "getDisputeAt": {
        message: {
            "index": number;
        };
        response: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
    };
    "deleteDispute": {
        message: {
            "context_id": Binary;
            "dispute_id": Binary;
        };
        response: {};
    };
};
type ConstructorsDescriptor = {
    "new": {
        message: {};
        response: {};
    };
};
type EventDescriptor = Enum<{}>;
export declare const descriptor: InkDescriptors<StorageDescriptor, MessagesDescriptor, ConstructorsDescriptor, EventDescriptor>;
export {};
