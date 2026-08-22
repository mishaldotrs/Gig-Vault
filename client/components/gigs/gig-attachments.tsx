"use client";

import { Github, Link2, ImageOff } from "lucide-react";
import { useState } from "react";
import { useGigMeta } from "@/hooks/use-gig-meta";
import type { GigAttachment } from "@/types/meta";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function AttachmentImage({ attachment }: { attachment: GigAttachment }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-border bg-surface text-muted-foreground">
        <ImageOff className="h-4 w-4" />
        <span className="text-[10px]">image unavailable</span>
      </div>
    );
  }
  return (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={attachment.url}
        alt={attachment.label ?? "Gig attachment"}
        className="h-24 w-36 rounded-md border border-border object-cover transition-opacity hover:opacity-80"
        onError={() => setBroken(true)}
      />
    </a>
  );
}

export function GigAttachments({ gigId }: { gigId: bigint }) {
  const { data } = useGigMeta(gigId);
  const attachments = data?.attachments ?? [];
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.kind === "image");
  const links = attachments.filter((a) => a.kind !== "image");

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((a, i) => (
            <AttachmentImage key={i} attachment={a} />
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {links.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {a.kind === "github" ? <Github className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              {a.label || hostnameOf(a.url)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
