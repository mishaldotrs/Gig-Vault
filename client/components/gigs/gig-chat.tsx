"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/use-wallet";
import { useGigChat, useSendChatMessage } from "@/hooks/use-gig-meta";
import { cn, truncateAddress } from "@/lib/utils";
import type { Gig } from "@/types/contract";

export function GigChat({ gig, highlight }: { gig: Gig; highlight?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { address } = useWallet();
  const { data: messages, isLoading } = useGigChat(gig.id, open);
  const send = useSendChatMessage(gig.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, open]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !address || send.isPending) return;
    send.mutate({ from: address, text: trimmed });
    setText("");
  };

  const counterpart = address === gig.client ? gig.freelancer : gig.client;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(highlight && "border-destructive/50 text-destructive")}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gig #{gig.id.toString()} — chat</DialogTitle>
          <DialogDescription>
            Direct thread with {counterpart ? truncateAddress(counterpart) : "the other party"}.
            Messages are off-chain — funds only move through the contract.
          </DialogDescription>
        </DialogHeader>

        {highlight && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            A milestone is under dispute — use this thread to work it out, or wait for the arbitrator.
          </div>
        )}

        <div className="h-72 space-y-2 overflow-y-auto rounded-md border border-border bg-surface p-3">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && (messages?.length ?? 0) === 0 && (
            <p className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
              No messages yet — say hello and sort out the details.
            </p>
          )}
          {messages?.map((m) => {
            const mine = m.from === address;
            return (
              <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-1.5 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background"
                  )}
                >
                  {m.text}
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {mine ? "you" : truncateAddress(m.from)} ·{" "}
                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message…"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" variant="vault" disabled={!text.trim() || send.isPending} onClick={handleSend}>
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
