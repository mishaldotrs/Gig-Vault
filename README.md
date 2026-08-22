# GigVault

A freelance marketplace built on Stellar/Soroban with **milestone escrow**, **dispute arbitration**, and **skill-based reputation scoring**. Clients fund work one milestone at a time; funds sit in the contract until the client approves the delivery — or, if the two sides disagree, until a designated arbitrator resolves it on-chain.

## Overview

GigVault replaces "trust the platform" freelance escrow with "trust the contract." Every gig is a sequence of milestones, each with its own escrow lifecycle:

```
Pending → Funded → Submitted → Released
                       ↘  Disputed → Released | Refunded
```

A freelancer's reputation is not a database row you could fake — it's a score the contract itself updates every time a milestone is released or a dispute is lost.

## Features

- **Milestone escrow** — clients fund milestones individually; a freelancer only sees funds move once the client (or an arbitrator) says so.
- **Dispute arbitration** — either party can flag a funded or submitted milestone; a fixed arbitrator address resolves it in favor of either side.
- **Skill-based reputation** — an on-chain score (0–1000) per address, tagged to a skill symbol, rising with completed work and falling with lost disputes.
- **Multi-wallet support** — connect with any wallet supported by StellarWalletsKit (Freighter, xBull, Albedo, Hana, Lobstr, WalletConnect, and more) through a single modal.
- **Real-time activity** — a live event feed polls the chain directly for contract events (no backend/indexer required) and a per-session transaction tracker shows pending → success/failed status with explorer links.
- **Friendly error handling** — wallet-not-found, user-rejected-signature, and insufficient-balance (plus four more) are caught and shown as plain-language messages, never raw RPC errors.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| Chain | Soroban SDK (Rust) + `@stellar/stellar-sdk` (JS) |
| Server state | TanStack Query (polling reads, mutation lifecycle) |
| Client state | Zustand (wallet session, tx tracker, live event buffer) |
| Contract language | Rust (`soroban-sdk` 22.0.8) |

## Project structure

```
gigvault/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Home
│   ├── dashboard/page.tsx   # Wallet dashboard (address, balances, network)
│   ├── app/page.tsx         # Main app — the gig marketplace
│   ├── activity/page.tsx    # Event feed + transaction history
│   ├── layout.tsx, providers.tsx, globals.css
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── wallet/               # Wallet connect button
│   ├── gigs/                 # Gig card, milestone rail, create-gig dialog, reputation badge
│   ├── activity/              # Event feed, transaction history, tx status badge
│   ├── dashboard/             # Wallet overview, reputation overview
│   └── layout/                # Header/nav
├── hooks/                   # useWallet, useGigVault (reads+mutations), useEvents, useAccountInfo, useToast
├── lib/
│   ├── wallet/               # StellarWalletsKit singleton + connect/sign helpers
│   ├── stellar/               # network config, RPC client, Horizon account fetch, event polling
│   ├── contract/               # typed GigVault contract client + deployed contract-ids.json
│   ├── store/                  # Zustand stores (wallet, tx tracker, events)
│   └── utils.ts
├── types/                   # contract.ts, wallet.ts (typed errors), events.ts
├── contracts/gigvault/      # Soroban contract (Rust) + tests
├── scripts/                 # build.sh, setup-identity.sh, deploy.sh
└── public/
```

## Setup

### 1. Prerequisites

- Node.js 20+
- Rust toolchain with the `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) (`stellar` command) — used for identities, build, and deploy

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

See `.env.example` for the full list. At minimum you'll set `NEXT_PUBLIC_CONTRACT_ID` after deploying (step 5 does this for you automatically).

### 4. Wallet setup

Install a Stellar wallet browser extension — [Freighter](https://www.freighter.app/) is the easiest for testnet — and switch it to **Testnet**. GigVault's "Connect wallet" button opens StellarWalletsKit's modal, which detects installed wallets automatically. No wallet installed shows a friendly "wallet not found" message instead of a raw error.

### 5. Contract deployment (Stellar Testnet)

```bash
# one-time: create/fund local CLI identities (admin, arbitrator, demo accounts)
npm run contract:setup-identity

# compile + optimize the contract to wasm
npm run contract:build

# deploy, initialize, and write the contract ID into lib/contract/contract-ids.json + .env.local
npm run contract:deploy
```

`scripts/deploy.sh` prints the deployed contract ID and a stellar.expert explorer link, e.g.:

```
==> Deployed contract: CONTRACT_ADDRESS_HERE
    Explorer: https://stellar.expert/explorer/testnet/contract/CONTRACT_ADDRESS_HERE
```

### 6. Local development

```bash
npm run dev
```

Visit `http://localhost:3000`. Connect a funded testnet wallet, post a gig from **Marketplace**, and watch **Activity** update automatically as milestones move through escrow.

### 7. Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the environment variables from `.env.example` (`NEXT_PUBLIC_CONTRACT_ID` at minimum) in the Vercel project settings.
4. Deploy. The contract itself lives on Stellar Testnet independently of the frontend host — redeploying the frontend never requires redeploying the contract.

## Smart contract design

`contracts/gigvault/src/lib.rs` implements:

- `initialize(admin, arbitrator, token)` — one-time setup, sets the escrow token and arbitrator address.
- `create_gig(client, title, skill, milestone_descriptions, milestone_amounts)` — posts a new gig.
- `accept_gig(freelancer, gig_id)` — assigns a freelancer to an open gig.
- `fund_milestone(client, gig_id, index)` — transfers escrow into the contract.
- `submit_milestone(freelancer, gig_id, index)` — marks work delivered.
- `approve_milestone(client, gig_id, index)` — releases escrow to the freelancer, updates reputation.
- `raise_dispute(caller, gig_id, index)` — freezes a funded/submitted milestone.
- `resolve_dispute(arbitrator, gig_id, index, favor_freelancer)` — arbitrator releases or refunds escrow, adjusts reputation.
- `get_gig`, `get_gig_count`, `get_reputation`, `get_arbitrator`, `get_token` — read-only views.

Errors are a typed `GigVaultError` enum (14 variants — not-found, wrong-role, wrong-status, etc.) so the frontend can show specific, friendly messages instead of generic panics.

Run the contract's own test suite with:

```bash
cd contracts && cargo test
```

## Error handling (frontend)

`types/wallet.ts` maps raw wallet/RPC errors into a typed `GigVaultError` with one of: `WALLET_NOT_FOUND`, `USER_REJECTED`, `INSUFFICIENT_BALANCE`, `SIMULATION_FAILED`, `NETWORK_MISMATCH`, `CONTRACT_NOT_CONFIGURED`, `UNKNOWN`. Every wallet and contract call in the app routes through this mapping before surfacing a toast, so users always see plain language ("Transaction was rejected in your wallet") instead of raw JSON-RPC errors.

## Real-time updates

- **Event feed** (`hooks/use-events.ts`) polls `server.getEvents` against the deployed contract every 6s, decodes topics/values with `scValToNative`, and merges new events into a Zustand store — so the feed grows without ever refetching what it already has.
- **Gig list / gig detail** (`hooks/use-gigvault.ts`) poll contract state via TanStack Query (`refetchInterval`), so milestone status updates propagate to every open tab without a manual refresh.
- **Transaction tracker** (`lib/store/tx-store.ts`) moves each submitted transaction through `pending → success | failed`, storing the hash the moment it's known and linking to `stellar.expert`.

## License

MIT — built as a demonstration project for Soroban smart-contract + Next.js integration.
# gigvault
