import { useCallback } from "react";
import { useNetwork } from "../context/NetworkContext.tsx";
import { useInfiniteLoad, type UseInfiniteLoadResult } from "./useInfiniteLoad.ts";
import type { DisputeCardData } from "../components/DisputeCard.tsx";

const PAGE_SIZE = 12;

export function useDisputes(): UseInfiniteLoadResult<DisputeCardData> {
  const { disputes, connected, aliceAddress } = useNetwork();

  const fetchCount = useCallback(async () => {
    const result = await disputes!.query("getTotalDisputeCount", {
      origin: aliceAddress,
      data: {},
    });
    return result.success ? Number(result.value.response) : 0;
  }, [disputes, aliceAddress]);

  const fetchPage = useCallback(
    async (start: number, count: number) => {
      const batch: DisputeCardData[] = [];
      for (let i = start; i < start + count; i++) {
        try {
          const refResult = await disputes!.query("getDisputeAt", {
            origin: aliceAddress,
            data: { index: i },
          });
          if (!refResult.success) continue;
          const ref = refResult.value.response;

          const infoResult = await disputes!.query("getDisputeInfo", {
            origin: aliceAddress,
            data: {
              context_id: ref.context_id,
              dispute_id: ref.dispute_id,
            },
          });
          if (!infoResult.success) continue;
          const info = infoResult.value.response;

          batch.push({
            contextId: String(ref.context_id),
            disputeId: String(ref.dispute_id),
            status: info.status,
            voteCount: Number(info.vote_count),
            claimant: info.claimant,
            against: String(info.against),
            instructionIndex: Number(info.instruction_index),
          });
        } catch (err) {
          console.error(`[useDisputes] Error fetching dispute at index ${i}:`, err);
        }
      }
      return batch;
    },
    [disputes, aliceAddress],
  );

  return useInfiniteLoad<DisputeCardData>({
    fetchCount,
    fetchPage,
    getId: (d) => `${d.contextId}-${d.disputeId}`,
    pageSize: PAGE_SIZE,
    enabled: !!disputes && connected,
    reverse: true,
  });
}
