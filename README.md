# GigVault

**Find Talent, Fund Work.** A freelance marketplace built on Stellar/Soroban with **milestone escrow**, **dispute arbitration**, and **on-chain reputation scoring**. Clients fund work one milestone at a time; funds sit in the contract until the client approves the delivery — or, if the two sides disagree, until a designated arbitrator resolves it on-chain.

| | |
|---|---|
| 🔗 **Live link** | [gigvault-dapp.vercel.app](https://gigvault-dapp.vercel.app/) |
| 📜 **Stellar smart contract (Testnet)** | [`CDHPJQSSRGWXBEZLGWEETBO4ONYHYD42PMRUA72GIRTLH3MHKNT6UCGP`](https://stellar.expert/explorer/testnet/contract/CDHPJQSSRGWXBEZLGWEETBO4ONYHYD42PMRUA72GIRTLH3MHKNT6UCGP) |
| 👨‍💻 **Developed by** | [@mishaldotrs](https://x.com/mishaldotrs) |

## Overview

GigVault replaces "trust the platform" freelance escrow with "trust the contract." Every gig is a sequence of milestones, each with its own escrow lifecycle:

```
                    ┌──(freelancer: fix & resubmit)──┐
                    ▼                                │
Pending → Funded → Submitted → Released              │
                       ↘  Disputed ──────────────────┘
                              ↘ (arbitrator) → Released | Refunded

Gig itself:  Open → InProgress → Completed
               │        │
               │        └─(freelancer rejects → escrow auto-refunds, gig reopens)
               └─(owner deletes → Cancelled)
```

A freelancer's reputation is not a database row you could fake — it's a score the contract itself updates every time a milestone is released or a dispute is lost.

## Features

- **Milestone escrow** — clients fund milestones individually; a freelancer only sees funds move once the client (or an arbitrator) says so.
- **Dispute arbitration** — either party can flag a funded or submitted milestone; a fixed arbitrator address resolves it in favor of either side.
- **Fix & resubmit** — a freelancer can rework a disputed delivery and resubmit it, letting both sides settle without waiting for the arbitrator.
- **Gig cancellation & rejection** — owners can delete their still-open gigs; an assigned freelancer can walk away, with escrowed funds automatically refunded to the client and the gig reopened for others.
- **On-chain reputation** — a score (0–1000, starting at a neutral 500) per address: +25 per completed milestone, +10 per dispute won, −40 per dispute lost. Computed by the contract, impossible to fake.
- **Attachments** — gig owners can attach reference images, a GitHub repo, or any link (stored off-chain, rendered on the gig card).
- **Client ↔ freelancer chat** — a per-gig message thread, highlighted during disputes so both sides can work it out.
- **Multi-wallet support** — connect with any wallet supported by StellarWalletsKit (Freighter, xBull, Albedo, Hana, Lobstr, WalletConnect, and more) through a single modal.
- **Real-time activity** — a live event feed polls the chain directly for contract events (no backend/indexer required) and a per-session transaction tracker shows pending → success/failed status with explorer links.
- **Friendly error handling** — wallet errors and all 14 contract error codes are translated into plain-language messages, never raw RPC dumps.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| Chain | `soroban-sdk` 22 (Rust) + `@stellar/stellar-sdk` 14 (JS) |
| Server state | TanStack Query (polling reads, mutation lifecycle) |
| Client state | Zustand (wallet session, tx tracker, live event buffer) |
| Off-chain extras | Next.js API routes (attachments + chat) |

## Project structure

```
gigvault/
├── client/                    # Next.js frontend
│   ├── app/                   # App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── app/page.tsx       # Marketplace
│   │   ├── dashboard/page.tsx # Wallet dashboard
│   │   ├── activity/page.tsx  # Event feed + transaction history
│   │   └── api/gigs/          # Off-chain attachments + chat API routes
│   ├── components/            # ui/, gigs/, wallet/, dashboard/, activity/, layout/
│   ├── hooks/                 # useWallet, useGigVault, useEvents, useGigMeta, …
│   ├── lib/
│   │   ├── wallet/            # StellarWalletsKit singleton + connect/sign helpers
│   │   ├── stellar/           # network config, RPC client, event polling
│   │   ├── contract/          # typed GigVault contract client + contract-ids.json
│   │   ├── server/            # file-backed store for off-chain extras
│   │   └── store/             # Zustand stores (wallet, tx tracker, events)
│   └── types/                 # contract.ts, wallet.ts, events.ts, meta.ts
├── contract/                  # Soroban contract (Rust workspace)
│   └── gigvault/src/          # lib.rs (contract) + test.rs (6 tests)
├── scripts/                   # build.sh, setup-identity.sh, deploy.sh
└── README.md
```

## Setup

### 1. Prerequisites

- Node.js 20+ (or Bun)
- Rust toolchain
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) (`stellar` command) — used for identities, build, and deploy

### 2. Install dependencies

```bash
cd client
npm install   # or: bun install
```

### 3. Environment variables

```bash
cp .env.example .env.local    # inside client/
```

At minimum you'll set `NEXT_PUBLIC_CONTRACT_ID` after deploying (the deploy script does this for you automatically).

### 4. Wallet setup

Install a Stellar wallet browser extension — [Freighter](https://www.freighter.app/) is the easiest for testnet — and switch it to **Testnet**. GigVault's "Connect wallet" button opens StellarWalletsKit's modal, which detects installed wallets automatically.

### 5. Contract deployment (Stellar Testnet)

From the repo root:

```bash
# one-time: create/fund local CLI identities (admin, arbitrator, demo accounts)
bash scripts/setup-identity.sh

# compile + optimize the contract to wasm
bash scripts/build.sh

# deploy, initialize, and write the contract ID into the frontend config
bash scripts/deploy.sh
```

`scripts/deploy.sh` prints the deployed contract ID and a stellar.expert explorer link.

### 6. Local development

```bash
cd client && npm run dev
```

Visit `http://localhost:3000`. Connect a funded testnet wallet, post a gig from **Marketplace**, and watch **Activity** update automatically as milestones move through escrow.

### 7. Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Set the project's **Root Directory** to `client`.
3. Add `NEXT_PUBLIC_CONTRACT_ID` in the Vercel project's environment variables.
4. Deploy. The contract lives on Stellar Testnet independently of the frontend host — redeploying the frontend never requires redeploying the contract.

> Note: attachments + chat use a local file store in development. On serverless hosts they won't persist between invocations — swap `client/lib/server/gig-store.ts` for a database (e.g. Neon/Postgres) for production use.

## Smart contract design

`contract/gigvault/src/lib.rs` implements:

- `initialize(admin, arbitrator, token)` — one-time setup, sets the escrow token and arbitrator address.
- `create_gig(client, title, skill, milestone_descriptions, milestone_amounts)` — posts a new gig.
- `accept_gig(freelancer, gig_id)` — assigns a freelancer to an open gig.
- `cancel_gig(client, gig_id)` — owner deletes a still-open gig (blocked once accepted).
- `reject_gig(freelancer, gig_id)` — freelancer walks away; escrowed funds auto-refund to the client and the gig reopens.
- `fund_milestone(client, gig_id, index)` — transfers escrow into the contract.
- `submit_milestone(freelancer, gig_id, index)` — marks work delivered.
- `resubmit_milestone(freelancer, gig_id, index)` — reworks a disputed milestone back to submitted.
- `approve_milestone(client, gig_id, index)` — releases escrow to the freelancer, updates reputation.
- `raise_dispute(caller, gig_id, index)` — freezes a funded/submitted milestone.
- `resolve_dispute(arbitrator, gig_id, index, favor_freelancer)` — arbitrator releases or refunds escrow, adjusts reputation.
- `get_gig`, `get_gig_count`, `get_reputation`, `get_arbitrator`, `get_token` — read-only views.

Errors are a typed `GigVaultError` enum (14 variants — not-found, wrong-role, wrong-status, etc.) so the frontend can show specific, friendly messages instead of generic panics.

Run the contract's test suite with:

```bash
cd contract && cargo test
```

## Error handling (frontend)

`client/types/wallet.ts` maps raw wallet/RPC errors into a typed `GigVaultError` with one of: `WALLET_NOT_FOUND`, `USER_REJECTED`, `INSUFFICIENT_BALANCE`, `SIMULATION_FAILED`, `NETWORK_MISMATCH`, `CONTRACT_NOT_CONFIGURED`, `UNKNOWN`. Contract error codes (`Error(Contract, #N)`) are translated to actionable messages ("A freelancer needs to accept this gig before milestones can move"), and every wallet and contract call routes through this mapping before surfacing a toast.

## Real-time updates

- **Event feed** (`client/hooks/use-events.ts`) polls `server.getEvents` against the deployed contract, decodes topics/values with `scValToNative`, and merges new events into a Zustand store — so the feed grows without ever refetching what it already has.
- **Gig list / gig detail** (`client/hooks/use-gigvault.ts`) poll contract state via TanStack Query (`refetchInterval`), so milestone status updates propagate to every open tab without a manual refresh.
- **Transaction tracker** (`client/lib/store/tx-store.ts`) moves each submitted transaction through `pending → success | failed`, storing the hash the moment it's known and linking to `stellar.expert`.
- **Chat** (`client/hooks/use-gig-meta.ts`) polls the per-gig thread every 3s while open.

## License

MIT — built as a demonstration project for Soroban smart-contract + Next.js integration.
