"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ID } from "@/lib/stellar/network";
import type { ChatMessage, GigAttachment, GigMeta } from "@/types/meta";

const metaKey = (gigId: string) => ["gig-meta", CONTRACT_ID, gigId];
const chatKey = (gigId: string) => ["gig-chat", CONTRACT_ID, gigId];

/** Off-chain attachments (images / repo links) for a gig. */
export function useGigMeta(gigId: bigint) {
  const id = gigId.toString();
  return useQuery({
    queryKey: metaKey(id),
    queryFn: async (): Promise<GigMeta> => {
      const res = await fetch(`/api/gigs/${id}/meta?contract=${CONTRACT_ID}`);
      if (!res.ok) throw new Error("Failed to load gig attachments");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export async function saveGigMeta(gigId: string, attachments: GigAttachment[]): Promise<void> {
  const res = await fetch(`/api/gigs/${gigId}/meta?contract=${CONTRACT_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachments }),
  });
  if (!res.ok) throw new Error("Failed to save gig attachments");
}

/** Live-ish chat thread between the gig's client and freelancer.
 * Polls while `enabled` (i.e. while the chat dialog is open). */
export function useGigChat(gigId: bigint, enabled: boolean) {
  const id = gigId.toString();
  return useQuery({
    queryKey: chatKey(id),
    queryFn: async (): Promise<ChatMessage[]> => {
      const res = await fetch(`/api/gigs/${id}/chat?contract=${CONTRACT_ID}`);
      if (!res.ok) throw new Error("Failed to load chat");
      const data = (await res.json()) as { messages: ChatMessage[] };
      return data.messages;
    },
    enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}

export function useSendChatMessage(gigId: bigint) {
  const id = gigId.toString();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ from, text }: { from: string; text: string }) => {
      const res = await fetch(`/api/gigs/${id}/chat?contract=${CONTRACT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to send message");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKey(id) }),
  });
}
