/** Off-chain gig metadata (attachments, chat). Stored via Next.js API
 * routes — deliberately NOT on-chain: large/mutable content doesn't belong
 * in contract storage, only escrow + state transitions do. */

export type AttachmentKind = "image" | "github" | "link";

export interface GigAttachment {
  kind: AttachmentKind;
  url: string;
  label?: string;
}

export interface GigMeta {
  attachments: GigAttachment[];
}

export interface ChatMessage {
  id: string;
  from: string; // wallet address of the sender
  text: string;
  ts: number;
}

export const ATTACHMENT_KIND_LABEL: Record<AttachmentKind, string> = {
  image: "Image",
  github: "GitHub repo",
  link: "Link",
};
