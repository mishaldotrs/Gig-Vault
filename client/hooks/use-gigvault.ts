"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as gigvault from "@/lib/contract/gigvault";
import { useWallet } from "@/hooks/use-wallet";
import { useTxStore } from "@/lib/store/tx-store";
import { useToast } from "@/hooks/use-toast";
import { toGigVaultError } from "@/types/wallet";
import { isContractConfigured } from "@/lib/stellar/network";

const GIGS_KEY = ["gigvault-gigs"];
const REPUTATION_KEY = (address: string) => ["gigvault-reputation", address];

export function useGigList() {
  return useQuery({
    queryKey: GIGS_KEY,
    queryFn: () => gigvault.listGigs(),
    enabled: isContractConfigured(),
    refetchInterval: 8000,
  });
}

export function useGig(gigId: bigint | undefined) {
  return useQuery({
    queryKey: ["gigvault-gig", gigId?.toString()],
    queryFn: () => gigvault.getGig(gigId as bigint),
    enabled: gigId !== undefined && isContractConfigured(),
    refetchInterval: 6000,
  });
}

export function useReputation(address: string | null) {
  return useQuery({
    queryKey: REPUTATION_KEY(address ?? ""),
    queryFn: () => gigvault.getReputation(address as string),
    enabled: Boolean(address) && isContractConfigured(),
    refetchInterval: 10000,
  });
}

/**
 * Wraps every state-changing contract call with wallet auth, transaction
 * tracking (pending/success/failed + hash), toasts, and cache invalidation.
 */
export function useGigVaultActions() {
  const { address, signTransaction } = useWallet();
  const { addPending, updateStatus } = useTxStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const run = useCallback(
    async <T,>(label: string, fn: () => Promise<{ hash: string; returnValue: T }>) => {
      if (!address) {
        const err = toGigVaultError(new Error("Connect a wallet first"));
        toast({ title: "Wallet required", description: err.message, variant: "destructive" });
        throw err;
      }
      const txId = `${label}-${Date.now()}`;
      addPending(txId, label);
      try {
        const { hash, returnValue } = await fn();
        updateStatus(txId, "success", { hash });
        toast({ title: `${label} confirmed`, description: `Transaction ${hash.slice(0, 8)}… succeeded.` });
        queryClient.invalidateQueries({ queryKey: GIGS_KEY });
        queryClient.invalidateQueries({ queryKey: ["gigvault-gig"] });
        queryClient.invalidateQueries({ queryKey: ["gigvault-reputation"] });
        return returnValue;
      } catch (err) {
        const gErr = toGigVaultError(err);
        updateStatus(txId, "failed", { errorMessage: gErr.message });
        toast({ title: `${label} failed`, description: gErr.message, variant: "destructive" });
        throw gErr;
      }
    },
    [address, addPending, updateStatus, toast, queryClient]
  );

  const createGig = useMutation({
    mutationFn: (params: {
      title: string;
      skill: string;
      milestoneDescriptions: string[];
      milestoneAmounts: bigint[];
    }) =>
      run("Post gig", () =>
        gigvault.createGig({ sourceAddress: address!, signTransaction }, params)
      ),
  });

  const acceptGig = useMutation({
    mutationFn: (gigId: bigint) =>
      run("Accept gig", () => gigvault.acceptGig({ sourceAddress: address!, signTransaction }, gigId)),
  });

  const cancelGig = useMutation({
    mutationFn: (gigId: bigint) =>
      run("Cancel gig", () => gigvault.cancelGig({ sourceAddress: address!, signTransaction }, gigId)),
  });

  const rejectGig = useMutation({
    mutationFn: (gigId: bigint) =>
      run("Reject gig", () => gigvault.rejectGig({ sourceAddress: address!, signTransaction }, gigId)),
  });

  const fundMilestone = useMutation({
    mutationFn: ({ gigId, milestoneIndex }: { gigId: bigint; milestoneIndex: number }) =>
      run("Fund milestone", () =>
        gigvault.fundMilestone({ sourceAddress: address!, signTransaction }, gigId, milestoneIndex)
      ),
  });

  const submitMilestone = useMutation({
    mutationFn: ({ gigId, milestoneIndex }: { gigId: bigint; milestoneIndex: number }) =>
      run("Submit milestone", () =>
        gigvault.submitMilestone({ sourceAddress: address!, signTransaction }, gigId, milestoneIndex)
      ),
  });

  const resubmitMilestone = useMutation({
    mutationFn: ({ gigId, milestoneIndex }: { gigId: bigint; milestoneIndex: number }) =>
      run("Resubmit milestone", () =>
        gigvault.resubmitMilestone({ sourceAddress: address!, signTransaction }, gigId, milestoneIndex)
      ),
  });

  const approveMilestone = useMutation({
    mutationFn: ({ gigId, milestoneIndex }: { gigId: bigint; milestoneIndex: number }) =>
      run("Approve milestone", () =>
        gigvault.approveMilestone({ sourceAddress: address!, signTransaction }, gigId, milestoneIndex)
      ),
  });

  const raiseDispute = useMutation({
    mutationFn: ({ gigId, milestoneIndex }: { gigId: bigint; milestoneIndex: number }) =>
      run("Raise dispute", () =>
        gigvault.raiseDispute({ sourceAddress: address!, signTransaction }, gigId, milestoneIndex)
      ),
  });

  const resolveDispute = useMutation({
    mutationFn: ({
      gigId,
      milestoneIndex,
      favorFreelancer,
    }: {
      gigId: bigint;
      milestoneIndex: number;
      favorFreelancer: boolean;
    }) =>
      run("Resolve dispute", () =>
        gigvault.resolveDispute(
          { sourceAddress: address!, signTransaction },
          gigId,
          milestoneIndex,
          favorFreelancer
        )
      ),
  });

  return {
    createGig,
    acceptGig,
    cancelGig,
    rejectGig,
    fundMilestone,
    submitMilestone,
    resubmitMilestone,
    approveMilestone,
    raiseDispute,
    resolveDispute,
  };
}
