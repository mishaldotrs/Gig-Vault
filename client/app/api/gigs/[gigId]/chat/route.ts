import { NextRequest, NextResponse } from "next/server";
import { getChat, appendChat, gigKey } from "@/lib/server/gig-store";
import type { ChatMessage } from "@/types/meta";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 1000;

function keyFrom(req: NextRequest, gigId: string): string {
  const contract = req.nextUrl.searchParams.get("contract") ?? "default";
  return gigKey(contract, gigId);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  const { gigId } = await params;
  const messages = await getChat(keyFrom(req, gigId));
  return NextResponse.json({ messages });
}

export async function POST(
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

  const from = String((body as { from?: unknown })?.from ?? "").trim();
  const text = String((body as { text?: unknown })?.text ?? "").trim();

  // Stellar public keys are 56-char StrKeys starting with G.
  if (!/^G[A-Z2-7]{55}$/.test(from)) {
    return NextResponse.json({ error: "Invalid sender address" }, { status: 400 });
  }
  if (!text || text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "Message must be 1-1000 characters" }, { status: 400 });
  }

  const message: ChatMessage = { id: randomUUID(), from, text, ts: Date.now() };
  await appendChat(keyFrom(req, gigId), message);
  return NextResponse.json({ message });
}
