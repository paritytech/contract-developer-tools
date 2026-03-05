import type { InkDescriptors } from 'polkadot-api/ink';
import type { HexString, Enum } from 'polkadot-api';
type Address = HexString;
type StorageDescriptor = {};
type MessagesDescriptor = {
    "getAddress": {
        message: {
            "contract_name": string;
        };
        response: {
            "isSome": boolean;
            "value": Address;
        };
    };
    "getAddressAtVersion": {
        message: {
            "contract_name": string;
            "version": number;
        };
        response: {
            "isSome": boolean;
            "value": Address;
        };
    };
    "getVersionCount": {
        message: {
            "contract_name": string;
        };
        response: number;
    };
    "getContractCount": {
        message: {};
        response: number;
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
