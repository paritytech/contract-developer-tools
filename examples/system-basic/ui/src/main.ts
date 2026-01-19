/**
 * Item Tracker UI - Main entry point
 *
 * Connects to local Substrate node and interacts with ItemTracker contract
 */

import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { contracts } from "@polkadot-api/descriptors";
import { Keyring } from "@polkadot/api";
import { getPolkadotSigner } from "polkadot-api/signer";
import { cryptoWaitReady } from "@polkadot/util-crypto";

// Configuration - update after deployment
const LOCAL_NODE = "ws://127.0.0.1:9944";
const CONTRACT_ADDRESS = ""; // Will be populated after deployment

// Types
type Item = {
    name: string;
    count: number;
};

type ItemWithId = Item & { id: number };

// State
let items: ItemWithId[] = [];
let isConnected = false;
let sdk: ReturnType<typeof createInkSdk> | null = null;
let contract: ReturnType<ReturnType<typeof createInkSdk>["getContract"]> | null = null;
let signer: { address: string; signer: ReturnType<typeof getPolkadotSigner> } | null = null;

// DOM Elements
const statusEl = document.getElementById("status")!;
const totalItemsEl = document.getElementById("total-items")!;
const totalCountEl = document.getElementById("total-count")!;
const itemNameInput = document.getElementById("item-name") as HTMLInputElement;
const createBtn = document.getElementById("create-btn") as HTMLButtonElement;
const itemsListEl = document.getElementById("items-list")!;
const logEl = document.getElementById("log")!;

// Utility functions
function log(message: string, type: "success" | "error" | "info" = "info") {
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.insertBefore(entry, logEl.firstChild);

    // Keep only last 50 entries
    while (logEl.children.length > 50) {
        logEl.removeChild(logEl.lastChild!);
    }
}

function setStatus(status: "connected" | "disconnected" | "loading", message: string) {
    statusEl.className = `status ${status}`;
    statusEl.textContent = message;
    isConnected = status === "connected";
    createBtn.disabled = !isConnected;
}

function updateStats() {
    totalItemsEl.textContent = items.length.toString();
    totalCountEl.textContent = items.reduce((sum, item) => sum + item.count, 0).toString();
}

function renderItems() {
    if (items.length === 0) {
        itemsListEl.innerHTML = '<div class="empty-state">No items yet. Create one above!</div>';
        return;
    }

    itemsListEl.innerHTML = items.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-info">
                <span class="item-id">#${item.id}</span>
                <span class="item-name">${escapeHtml(item.name)}</span>
            </div>
            <div class="item-count">${item.count}</div>
            <div class="item-actions">
                <button class="secondary decrement-btn" ${item.count === 0 ? "disabled" : ""}>−</button>
                <button class="primary increment-btn">+</button>
                <button class="danger delete-btn">🗑</button>
            </div>
        </div>
    `).join("");

    // Attach event listeners
    itemsListEl.querySelectorAll(".item-card").forEach(card => {
        const id = parseInt(card.getAttribute("data-id")!);

        card.querySelector(".increment-btn")?.addEventListener("click", () => incrementItem(id));
        card.querySelector(".decrement-btn")?.addEventListener("click", () => decrementItem(id));
        card.querySelector(".delete-btn")?.addEventListener("click", () => deleteItem(id));
    });
}

function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Contract interaction functions
async function loadItems() {
    if (!contract || !signer) return;

    try {
        // Get all item IDs
        const idsResult = await contract.query("get_all_ids", {
            origin: signer.address,
            data: {},
        });

        if (!idsResult.value?.success) {
            throw new Error("Failed to get item IDs");
        }

        const ids: number[] = idsResult.value.value;

        // Load each item
        items = [];
        for (const id of ids) {
            const itemResult = await contract.query("get_item", {
                origin: signer.address,
                data: { id },
            });

            if (itemResult.value?.success && itemResult.value.value) {
                const item = itemResult.value.value as Item;
                items.push({ id, ...item });
            }
        }

        updateStats();
        renderItems();
        log(`Loaded ${items.length} items`, "success");
    } catch (err: any) {
        log(`Failed to load items: ${err.message}`, "error");
    }
}

async function createItem() {
    if (!contract || !signer) return;

    const name = itemNameInput.value.trim();
    if (!name) {
        log("Please enter an item name", "error");
        return;
    }

    try {
        log(`Creating item "${name}"...`, "info");
        createBtn.disabled = true;

        const result = await contract
            .send("create_item", {
                origin: signer.address,
                data: { name },
            })
            .signAndSubmit(signer.signer);

        log(`Item created! tx: ${result.txHash.slice(0, 10)}...`, "success");
        itemNameInput.value = "";

        // Reload items
        await loadItems();
    } catch (err: any) {
        log(`Failed to create item: ${err.message}`, "error");
    } finally {
        createBtn.disabled = !isConnected;
    }
}

async function incrementItem(id: number) {
    if (!contract || !signer) return;

    try {
        log(`Incrementing item #${id}...`, "info");

        await contract
            .send("increment", {
                origin: signer.address,
                data: { id },
            })
            .signAndSubmit(signer.signer);

        log(`Item #${id} incremented`, "success");
        await loadItems();
    } catch (err: any) {
        log(`Failed to increment: ${err.message}`, "error");
    }
}

async function decrementItem(id: number) {
    if (!contract || !signer) return;

    try {
        log(`Decrementing item #${id}...`, "info");

        await contract
            .send("decrement", {
                origin: signer.address,
                data: { id },
            })
            .signAndSubmit(signer.signer);

        log(`Item #${id} decremented`, "success");
        await loadItems();
    } catch (err: any) {
        log(`Failed to decrement: ${err.message}`, "error");
    }
}

async function deleteItem(id: number) {
    if (!contract || !signer) return;

    if (!confirm(`Delete item #${id}?`)) return;

    try {
        log(`Deleting item #${id}...`, "info");

        await contract
            .send("delete_item", {
                origin: signer.address,
                data: { id },
            })
            .signAndSubmit(signer.signer);

        log(`Item #${id} deleted`, "success");
        await loadItems();
    } catch (err: any) {
        log(`Failed to delete: ${err.message}`, "error");
    }
}

// Initialize
async function init() {
    log("Initializing...", "info");
    setStatus("loading", "Initializing crypto...");

    try {
        // Wait for crypto to be ready
        await cryptoWaitReady();
        log("Crypto ready", "success");

        // Create Alice signer
        const keyring = new Keyring({ type: "sr25519" });
        const pair = keyring.addFromUri("//Alice", {}, "sr25519");
        signer = {
            address: pair.address,
            signer: getPolkadotSigner(
                pair.publicKey,
                "Sr25519",
                (data: Uint8Array) => pair.sign(data)
            ),
        };
        log(`Using Alice: ${signer.address.slice(0, 8)}...`, "info");

        // Check if contract address is configured
        if (!CONTRACT_ADDRESS) {
            setStatus("disconnected", "Contract address not configured. Deploy the contract first.");
            log("CONTRACT_ADDRESS not set. Please deploy the contract and update the address.", "error");
            return;
        }

        // Connect to local node
        setStatus("loading", `Connecting to ${LOCAL_NODE}...`);
        log(`Connecting to ${LOCAL_NODE}...`, "info");

        const client = createClient(
            withPolkadotSdkCompat(getWsProvider(LOCAL_NODE))
        );

        sdk = createInkSdk(client);
        contract = sdk.getContract(contracts.item_tracker, CONTRACT_ADDRESS);

        setStatus("connected", `Connected to local node as Alice`);
        log("Connected to local node", "success");

        // Load initial data
        await loadItems();

    } catch (err: any) {
        setStatus("disconnected", `Connection failed: ${err.message}`);
        log(`Initialization failed: ${err.message}`, "error");
    }
}

// Event listeners
createBtn.addEventListener("click", createItem);
itemNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") createItem();
});

// Start
init();
