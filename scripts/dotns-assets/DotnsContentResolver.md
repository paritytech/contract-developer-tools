# DotnsContentResolver

Stores per-node contenthash and arbitrary text key/value records — where a name points at content (e.g. an IPFS CID) and publishes metadata (social handles, avatars, verification data).

## Interface

**Reads (open)**: `contenthash(node) → bytes`, `text(node, key) → string`, `isApprovedForAll(owner, operator) → bool`.

**Writes**:
- `setContenthash(node, bytes)`, `setText(node, key, value)` — node owner or an approved operator (`NotAuthorised` otherwise).
- `setApprovalForAll(operator, bool)` — caller delegates all their nodes, ERC721-style.

UUPS-upgradeable, `Ownable`. Node ownership is checked against the forward registry, resolved live from the protocol registry.

## Notes

- Records are opaque bytes/strings — no validation or normalization; text keys are case-sensitive.
