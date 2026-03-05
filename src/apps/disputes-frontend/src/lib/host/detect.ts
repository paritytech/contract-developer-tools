import { sandboxTransport } from "@novasamatech/product-sdk";

export function isInHost(): boolean {
    return sandboxTransport.isCorrectEnvironment();
}
