import type { InkDescriptors } from 'polkadot-api/ink';
import type { HexString, Enum, Binary } from 'polkadot-api';
type Address = HexString;
type StorageDescriptor = {};
type MessagesDescriptor = {
    "registerContext": {
        message: {
            "context_id": Binary;
        };
        response: {};
    };
    "getOwner": {
        message: {
            "context_id": Binary;
        };
        response: Address;
    };
    "isOwner": {
        message: {
            "context_id": Binary;
            "address": Address;
        };
        response: boolean;
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
