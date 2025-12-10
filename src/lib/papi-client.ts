import type { Rating, RatingInput, SubmitResult } from '@/types';
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { FixedSizeBinary } from 'polkadot-api';

import { getSigner } from "./signer";

const WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT || 'ws://127.0.0.1:9944';
const CONTRACT_ADDR = import.meta.env.VITE_WS_ENDPOINT
const ALICE = getSigner("Alice");

export async function getRatings(sellerFilter?: string): Promise<Rating[]> {
  await new Promise(r => setTimeout(r, 300));
  
  // TODO: Replace with real PAPI call:
  const { createClient } = await import('polkadot-api');
  const { getWsProvider } = await import('polkadot-api/ws-provider/web');
  const { contracts } = await import('@polkadot-api/descriptors');
  const provider = getWsProvider(WS_ENDPOINT);
  const client = createClient(provider);

  const inkSdk = createInkSdk(client);
  const repContract = inkSdk.getContract(contracts.mark3t_rep, CONTRACT_ADDR);
  console.log("fetching ratings")
  let ratings = await repContract.query("get_all_seller_ratings", { origin: ALICE.address });

  console.log(ratings);
  /*
  if (sellerFilter) {
    return mockRatings.filter(r => r.seller.toLowerCase().includes(sellerFilter.toLowerCase()));
  }
  */
  return [];
}

export async function submitRating(rating: RatingInput, signer: any): Promise<SubmitResult> {
  await new Promise(r => setTimeout(r, 1000));
  
  // TODO: Replace with real PAPI call:
  // const tx = api.tx.SellerRatings.submit_rating({...rating});
  // const result = await tx.signAndSubmit(signer);
  
  const newRating: Rating = {
    ...rating,
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
  };
  
  
  return { success: true, hash: '0x' + Math.random().toString(16).slice(2, 18) };
}

export async function connectWallet() {
  const { getInjectedExtensions, connectInjectedExtension } = await import('polkadot-api/pjs-signer');
  const extensions = getInjectedExtensions();
  if (extensions.length === 0) throw new Error('No wallet extension found');
  const ext = await connectInjectedExtension(extensions[0]);
  const accounts = ext.getAccounts();
  if (accounts.length === 0) throw new Error('No accounts found');
  return { account: accounts[0], signer: ext.signer };
}
