import type { Rating, RatingInput, SubmitResult } from '@/types';
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider";
import { contracts } from "@polkadot-api/descriptors";

import { getSigner } from "./signer";

const WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT || 'ws://127.0.0.1:9944';
const CONTRACT_ADDR = import.meta.env.VITE_CONTRACT_ADDRESS
const ALICE = getSigner("Alice");

const provider = getWsProvider(WS_ENDPOINT);
const client = createClient(withPolkadotSdkCompat(provider));

const inkSdk = createInkSdk(client);
const repContract = inkSdk.getContract(contracts.mark3t_rep, CONTRACT_ADDR);

export async function getRatings(idToShop: (id: number) => string, sellerId?: number, sellerFilter?: string): Promise<Rating[]> {
  
  let ratings = sellerId ?
    await repContract.query("get_all_seller_ratings_for", { origin: ALICE.address, data: { seller_id: sellerId! } }) :
    await repContract.query("get_all_seller_ratings", { origin: ALICE.address });

  console.log(sellerId, ratings);
  if (ratings.success) {
    return ratings.value.response.map((r, index) => {return { 
        id: index,
        seller_id: r.seller_id,
        seller: idToShop(r.seller_id),
        date: new Date(Number(r.timestamp) * 1000).toDateString(),
        comment: r.remark || "",
        article: r.article_score,
        shipping: r.shipping_score,
        communication: r.seller_score
    }});

  } else return [];

}


function rnd(bound: number = 20): number {
    return Math.floor(Math.random() * bound) + 1;
}

export async function submitRating(rating: RatingInput, signer: any): Promise<SubmitResult> {

  let submitData = { seller_rating: {
          purchase_id: BigInt(rnd(10000000)),
          timestamp: BigInt(1),
          buyer: rnd(14),
          seller_id: rating.seller_id,
          article_id: rnd(20),
          seller_score: rating.communication,
          article_score: rating.article,
          shipping_score: rating.shipping,
          remark: rating.comment,
      }
    }
    console.log(submitData)
  //console.log(signer);
  const tx = repContract.send("submit_seller_rating", {
                origin: ALICE.address,
                data: { seller_rating: {
          purchase_id: BigInt(rnd(10000000)),
          timestamp: BigInt(1),
          buyer: rnd(14),
          seller_id: rating.seller_id,
          article_id: rnd(20),
          seller_score: rating.communication,
          article_score: rating.article,
          shipping_score: rating.shipping,
          remark: rating.comment,
                }
                }
            });

  const result = await tx.signAndSubmit(ALICE.signer);
  console.log(result);
  return { success: result.ok, hash: ALICE.address};
}

export async function connectWallet() {
  const { getInjectedExtensions, connectInjectedExtension } = await import('polkadot-api/pjs-signer');
  const extensions = getInjectedExtensions();
  if (extensions.length === 0) throw new Error('No wallet extension found');
  const ext = await connectInjectedExtension(extensions[0]);
  const accounts = ext.getAccounts();
  if (accounts.length === 0) throw new Error('No accounts found');
  return { account: accounts[0], signer: ext.signer};
}



