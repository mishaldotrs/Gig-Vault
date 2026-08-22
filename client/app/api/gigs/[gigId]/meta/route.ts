import { NextRequest, NextResponse } from "next/server";
import { getGigMeta, setGigMeta, gigKey } from "@/lib/server/gig-store";
import type { GigAttachment, AttachmentKind } from "@/types/meta";

export const dynamic = "force-dynamic";

const VALID_KINDS: AttachmentKind[] = ["image", "github", "link"];
const MAX_ATTACHMENTS = 8;
const MAX_URL_LENGTH = 500;
const MAX_LABEL_LENGTH = 80;

function keyFrom(req: NextRequest, gigId: string): string {
  const contract = req.nextUrl.searchParams.get("contract") ?? "default";
  return gigKey(contract, gigId);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  const { gigId } = await params;
  const meta = await getGigMeta(keyFrom(req, gigId));
  return NextResponse.json(meta);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  const { gigId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawAttachments = (body as { attachments?: unknown })?.attachments;
  if (!Array.isArray(rawAttachments)) {
    return NextResponse.json({ error: "attachments must be an array" }, { status: 400 });
  }

  const attachments: GigAttachment[] = [];
  for (const raw of rawAttachments.slice(0, MAX_ATTACHMENTS)) {
    const kind = (raw as GigAttachment)?.kind;
    const url = String((raw as GigAttachment)?.url ?? "").trim();
    const label = String((raw as GigAttachment)?.label ?? "").trim();

    if (!VALID_KINDS.includes(kind)) continue;
    if (!/^https?:\/\//i.test(url) || url.length > MAX_URL_LENGTH) continue;

    attachments.push({
      kind,
      url,
      ...(label ? { label: label.slice(0, MAX_LABEL_LENGTH) } : {}),
    });
  }

  await setGigMeta(keyFrom(req, gigId), { attachments });
  return NextResponse.json({ attachments });
}
