import { useState, useEffect, useCallback } from 'react';
import { getRatings, submitRating, connectWallet } from '@/lib/papi-client';
import type { Rating, RatingInput, SubmitResult } from '@/types';

export function useRatings(idToShop: (id: number) => string, sellerFilter?: string) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRatings(await getRatings(idToShop, sellerFilter));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [sellerFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ratings, loading, error, refresh };
}

export function useWallet() {
  const [wallet, setWallet] = useState<{ account: any; signer: any } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      setWallet(await connectWallet());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  }, []);

  return { wallet, connect, connecting, error };
}

export function useSubmitRating() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (rating: RatingInput, signer: any) => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await submitRating(rating, signer);
      setResult(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, result, error };
}
