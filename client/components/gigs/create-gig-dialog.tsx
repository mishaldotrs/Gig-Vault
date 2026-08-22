"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGigVaultActions } from "@/hooks/use-gigvault";
import { useWallet } from "@/hooks/use-wallet";
import { unitsToStroops } from "@/lib/utils";
import { saveGigMeta } from "@/hooks/use-gig-meta";
import { ATTACHMENT_KIND_LABEL, type AttachmentKind, type GigAttachment } from "@/types/meta";

interface MilestoneRow {
  description: string;
  amount: string;
}

interface AttachmentRow {
  kind: AttachmentKind;
  url: string;
}

const EMPTY_ROW: MilestoneRow = { description: "", amount: "" };
const ATTACHMENT_KINDS: AttachmentKind[] = ["image", "github", "link"];

export function CreateGigDialog() {
  const { isConnected } = useWallet();
  const { createGig } = useGigVaultActions();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [skill, setSkill] = useState("");
  const [rows, setRows] = useState<MilestoneRow[]>([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);

  const updateRow = (i: number, patch: Partial<MilestoneRow>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const addRow = () => setRows((r) => [...r, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const updateAttachment = (i: number, patch: Partial<AttachmentRow>) =>
    setAttachments((a) => a.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addAttachment = () => setAttachments((a) => [...a, { kind: "image", url: "" }]);
  const removeAttachment = (i: number) => setAttachments((a) => a.filter((_, idx) => idx !== i));

  const validRows = rows.filter((r) => r.description.trim() && Number(r.amount) > 0);
  const canSubmit = title.trim().length > 0 && skill.trim().length > 0 && validRows.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const gigId = await createGig.mutateAsync({
      title: title.trim(),
      skill: skill.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 32),
      milestoneDescriptions: validRows.map((r) => r.description.trim()),
      milestoneAmounts: validRows.map((r) => unitsToStroops(Number(r.amount))),
    });

    // Attachments live off-chain — best-effort save keyed by the new gig id.
    const validAttachments: GigAttachment[] = attachments
      .map((a) => ({ kind: a.kind, url: a.url.trim() }))
      .filter((a) => /^https?:\/\//i.test(a.url));
    if (validAttachments.length > 0 && gigId !== undefined && gigId !== null) {
      try {
        await saveGigMeta(String(gigId), validAttachments);
      } catch {
        // Never block gig creation on attachment persistence.
      }
    }

    setOpen(false);
    setTitle("");
    setSkill("");
    setRows([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
    setAttachments([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="vault" disabled={!isConnected}>
          <Plus />
          Post a gig
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a new gig</DialogTitle>
          <DialogDescription>
            Break the work into milestones — each one gets its own escrow seal that unlocks on approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Redesign our onboarding flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill">Primary skill</Label>
            <Input
              id="skill"
              placeholder="design, backend, security, writing…"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Milestones</Label>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={`Milestone ${i + 1} description`}
                  value={row.description}
                  onChange={(e) => updateRow(i, { description: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={row.amount}
                  onChange={(e) => updateRow(i, { amount: e.target.value })}
                  className="w-28 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" />
              Add milestone
            </Button>
          </div>

          <div className="space-y-2">
            <Label>
              Attachments <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            {attachments.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.kind}
                  onChange={(e) => updateAttachment(i, { kind: e.target.value as AttachmentKind })}
                  className="h-10 w-32 shrink-0 rounded-md border border-input bg-surface px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ATTACHMENT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {ATTACHMENT_KIND_LABEL[kind]}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder={
                    row.kind === "github"
                      ? "https://github.com/user/repo"
                      : row.kind === "image"
                        ? "https://…/screenshot.png"
                        : "https://…"
                  }
                  value={row.url}
                  onChange={(e) => updateAttachment(i, { url: e.target.value })}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
              <Plus className="h-3.5 w-3.5" />
              Add attachment
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Reference images, the GitHub repo, or any link — stored off-chain, shown on the gig card.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="vault" onClick={handleSubmit} disabled={!canSubmit || createGig.isPending}>
            {createGig.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Post gig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
