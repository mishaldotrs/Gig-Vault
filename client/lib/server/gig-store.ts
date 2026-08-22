/** Tiny file-backed store for off-chain gig extras (attachments + chat).
 *
 * Server-only — imported exclusively by API route handlers. Data lives in
 * `.gigvault-data/store.json` (gitignored). Keys are namespaced by contract
 * ID so redeploys (which reset gig IDs to 0) never mix data across
 * deployments. Swap this for NeonDB/Postgres later without changing the
 * API surface.
 */
import { promises as fs } from "fs";
import path from "path";
import type { ChatMessage, GigMeta } from "@/types/meta";

const DATA_DIR = path.join(process.cwd(), ".gigvault-data");
const FILE = path.join(DATA_DIR, "store.json");

interface StoreShape {
  meta: Record<string, GigMeta>;
  chat: Record<string, ChatMessage[]>;
}

const EMPTY: StoreShape = { meta: {}, chat: {} };

async function load(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return { meta: parsed.meta ?? {}, chat: parsed.chat ?? {} };
  } catch {
    return { ...EMPTY, meta: {}, chat: {} };
  }
}

async function save(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export function gigKey(contractId: string, gigId: string): string {
  return `${contractId}:${gigId}`;
}

export async function getGigMeta(key: string): Promise<GigMeta> {
  const store = await load();
  return store.meta[key] ?? { attachments: [] };
}

export async function setGigMeta(key: string, meta: GigMeta): Promise<void> {
  const store = await load();
  store.meta[key] = meta;
  await save(store);
}

export async function getChat(key: string): Promise<ChatMessage[]> {
  const store = await load();
  return store.chat[key] ?? [];
}

const MAX_MESSAGES = 200;

export async function appendChat(key: string, message: ChatMessage): Promise<void> {
  const store = await load();
  const messages = store.chat[key] ?? [];
  messages.push(message);
  store.chat[key] = messages.slice(-MAX_MESSAGES);
  await save(store);
}
