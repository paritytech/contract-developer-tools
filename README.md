# contract-developer-tools

#### Prerequisites

-   [pop cli](https://onpop.io/cli/): `brew install r0gue-io/pop-cli/pop`
-   [bun](https://bun.sh/): `curl -fsSL https://bun.sh/install | bash`
-   [pnpm](https://pnpm.io/)

Setup the repository by running the commmand `bash scripts/setup.sh`

**Build**: `bash scripts/build.sh`

**Test**: `bash scripts/test.sh `

<!-- ### Deploy & Test Manually -->

## Test Client

Interact with the [contract](contexts/market/lib.rs) deployed on Paseo

1. Build the contract to generate the `target` build artifact

2. Inside of the `test_client` directory,

```sh
# Interact with the paseo contract
bun src/index.ts

# View storage of the paseo contract
bun src/view.ts
```

3. edit the files to try out different parts of functionality. type hints should be available to explore available functions/storage.

### TODO

-   Connect to existing "market core" contract and start querying for relevant information
    -   real `product_id`'s and `seller_id`'s.
    -   query if/when a customer purchased a product associated with a given `product_id` & `seller_id`.
-   Connect to `PoP` (at least a some mock contract interface)
-   Build out real white-listing mechanics; ex:
    -   is this a person
    -   did they actually buy this product (or a product from this seller)
